const { generateQuestions } = require('./questionGenerator');

const lobbies     = new Map(); // code  -> lobby
const playerLobby = new Map(); // ws.id -> code

const REVEAL_PAUSE = 3500;

// ── helpers ────────────────────────────────────────────────────────────────

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do { code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
  while (lobbies.has(code));
  return code;
}

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function broadcast(wss, code, msg) {
  const lobby = lobbies.get(code);
  if (!lobby) return;
  const json = JSON.stringify(msg);
  wss.clients.forEach(c => { if (c.readyState === 1 && lobby.players.has(c.id)) c.send(json); });
}

function scoreboard(lobby) {
  return [...lobby.players.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ id, nickname, score, isHost, correctCount }) => ({ id, nickname, score, isHost, correct: correctCount }));
}

function sanitizeSettings(s = {}) {
  return {
    category:        String(s.category  ?? ''),
    difficulty:      ['', 'easy', 'medium', 'hard'].includes(s.difficulty) ? s.difficulty : '',
    amount:          Math.min(30, Math.max(3, parseInt(s.amount) || 10)),
    timePerQuestion: Math.min(60, Math.max(5,  parseInt(s.timePerQuestion) || 20)),
    scoring:         s.scoring === 'simple' ? 'simple' : 'speed',
  };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makePlayer(id, nickname, isHost) {
  return { id, nickname, score: 0, isHost, correctCount: 0, hasAnswered: false, lastCorrect: false, lastPoints: 0 };
}

// ── game flow ───────────────────────────────────────────────────────────────

function sendQuestion(wss, lobby) {
  lobby.state = 'QUESTION';
  lobby.players.forEach(p => { p.hasAnswered = false; p.lastCorrect = false; p.lastPoints = 0; });

  const q = lobby.questions[lobby.currentIndex];
  lobby.timeLeft = lobby.settings.timePerQuestion;

  broadcast(wss, lobby.code, {
    type:          'QUESTION',
    questionIndex: lobby.currentIndex,
    total:         lobby.questions.length,
    question:      q.question,
    answers:       shuffle([q.correct_answer, ...q.incorrect_answers]),
    category:      q.category,
    difficulty:    q.difficulty,
    timeLimit:     lobby.settings.timePerQuestion,
  });

  clearInterval(lobby.timer);
  lobby.timer = setInterval(() => {
    lobby.timeLeft = Math.max(0, lobby.timeLeft - 1);
    if (lobby.timeLeft <= 0) {
      clearInterval(lobby.timer);
      if (lobby.state === 'QUESTION') revealAndAdvance(wss, lobby);
    }
  }, 1000);
}

function revealAndAdvance(wss, lobby) {
  lobby.state = 'REVEAL';
  clearInterval(lobby.timer);

  const q = lobby.questions[lobby.currentIndex];

  broadcast(wss, lobby.code, {
    type:          'REVEAL',
    correctAnswer: q.correct_answer,
    playerResults: [...lobby.players.values()].map(p => ({
      id: p.id, nickname: p.nickname, correct: p.lastCorrect, points: p.lastPoints, score: p.score,
    })),
    scoreboard: scoreboard(lobby),
  });

  setTimeout(() => {
    if (!lobbies.has(lobby.code)) return;
    lobby.currentIndex++;
    if (lobby.currentIndex < lobby.questions.length) {
      sendQuestion(wss, lobby);
    } else {
      lobby.state = 'RESULTS';
      broadcast(wss, lobby.code, { type: 'GAME_OVER', scoreboard: scoreboard(lobby) });
    }
  }, REVEAL_PAUSE);
}

// ── message handler ─────────────────────────────────────────────────────────

async function handleMessage(ws, msg, wss) {
  const { type } = msg;

  // ── CREATE_LOBBY ──
  if (type === 'CREATE_LOBBY') {
    const nickname = String(msg.nickname || '').trim().slice(0, 24);
    if (!nickname) return send(ws, { type: 'ERROR', message: 'Nickname is required.' });

    const code  = makeCode();
    const lobby = {
      code, state: 'WAITING',
      settings: sanitizeSettings(msg.settings),
      players: new Map([[ws.id, makePlayer(ws.id, nickname, true)]]),
      questions: [], currentIndex: 0, timeLeft: 0, timer: null, hostId: ws.id,
    };
    lobbies.set(code, lobby);
    playerLobby.set(ws.id, code);
    send(ws, { type: 'LOBBY_CREATED', code, playerId: ws.id, settings: lobby.settings, players: scoreboard(lobby) });
  }

  // ── JOIN_LOBBY ──
  else if (type === 'JOIN_LOBBY') {
    const nickname = String(msg.nickname || '').trim().slice(0, 24);
    const code     = String(msg.code || '').toUpperCase().trim();
    const lobby    = lobbies.get(code);

    if (!nickname) return send(ws, { type: 'ERROR', message: 'Nickname is required.' });
    if (!lobby)    return send(ws, { type: 'ERROR', message: 'Lobby not found.' });
    if (lobby.state !== 'WAITING') return send(ws, { type: 'ERROR', message: 'Game already in progress.' });
    if (lobby.players.size >= 20) return send(ws, { type: 'ERROR', message: 'Lobby is full (max 20).' });

    const taken = [...lobby.players.values()].some(p => p.nickname.toLowerCase() === nickname.toLowerCase());
    if (taken) return send(ws, { type: 'ERROR', message: 'That nickname is already taken.' });

    lobby.players.set(ws.id, makePlayer(ws.id, nickname, false));
    playerLobby.set(ws.id, code);
    send(ws, { type: 'JOINED_LOBBY', code, playerId: ws.id, settings: lobby.settings, players: scoreboard(lobby), hostId: lobby.hostId });
    broadcast(wss, code, { type: 'PLAYER_JOINED', players: scoreboard(lobby) });
  }

  // ── UPDATE_SETTINGS ──
  else if (type === 'UPDATE_SETTINGS') {
    const code  = playerLobby.get(ws.id);
    const lobby = lobbies.get(code);
    if (!lobby || lobby.hostId !== ws.id || lobby.state !== 'WAITING') return;
    lobby.settings = sanitizeSettings(msg.settings);
    broadcast(wss, code, { type: 'SETTINGS_UPDATED', settings: lobby.settings });
  }

  // ── START_GAME ──
  else if (type === 'START_GAME') {
    const code  = playerLobby.get(ws.id);
    const lobby = lobbies.get(code);
    if (!lobby || lobby.hostId !== ws.id || lobby.state !== 'WAITING') return;

    lobby.state = 'GENERATING';
    lobby.players.forEach(p => { p.score = 0; p.correctCount = 0; });
    broadcast(wss, code, { type: 'GENERATING_QUESTIONS' });

    try {
      lobby.questions    = await generateQuestions(lobby.settings);
      lobby.currentIndex = 0;
      sendQuestion(wss, lobby);
    } catch (err) {
      console.error('Question generation failed:', err);
      lobby.state = 'WAITING';
      broadcast(wss, code, { type: 'ERROR', message: 'Failed to generate questions — please try again.' });
    }
  }

  // ── ANSWER ──
  else if (type === 'ANSWER') {
    const code  = playerLobby.get(ws.id);
    const lobby = lobbies.get(code);
    if (!lobby || lobby.state !== 'QUESTION') return;

    const player = lobby.players.get(ws.id);
    if (!player || player.hasAnswered) return;

    const q         = lobby.questions[lobby.currentIndex];
    const isCorrect = msg.answer === q.correct_answer;
    const timeLeft  = Math.max(0, lobby.timeLeft);

    player.hasAnswered  = true;
    player.lastCorrect  = isCorrect;
    player.lastPoints   = isCorrect
      ? (lobby.settings.scoring === 'speed' ? Math.round(200 + (timeLeft / lobby.settings.timePerQuestion) * 800) : 1)
      : 0;
    player.score       += player.lastPoints;
    if (isCorrect) player.correctCount++;

    send(ws, { type: 'ANSWER_ACK', correct: isCorrect, points: player.lastPoints });

    const allDone = [...lobby.players.values()].every(p => p.hasAnswered);
    if (allDone) {
      clearInterval(lobby.timer);
      revealAndAdvance(wss, lobby);
    }
  }

  // ── KICK ──
  else if (type === 'KICK') {
    const code  = playerLobby.get(ws.id);
    const lobby = lobbies.get(code);
    if (!lobby || lobby.hostId !== ws.id || lobby.state !== 'WAITING') return;

    const targetId = String(msg.playerId || '');
    if (!targetId || targetId === ws.id) return;

    let targetWs;
    wss.clients.forEach(c => { if (c.id === targetId && lobby.players.has(c.id)) targetWs = c; });
    if (!targetWs) return;

    send(targetWs, { type: 'KICKED' });
    targetWs.close();
  }

  // ── PLAY_AGAIN ──
  else if (type === 'PLAY_AGAIN') {
    const code  = playerLobby.get(ws.id);
    const lobby = lobbies.get(code);
    if (!lobby || lobby.hostId !== ws.id || lobby.state !== 'RESULTS') return;

    lobby.state        = 'WAITING';
    lobby.questions    = [];
    lobby.currentIndex = 0;
    lobby.players.forEach(p => { p.score = 0; p.correctCount = 0; });
    broadcast(wss, code, { type: 'BACK_TO_LOBBY', settings: lobby.settings, players: scoreboard(lobby) });
  }
}

// ── disconnect handler ──────────────────────────────────────────────────────

function handleDisconnect(ws, wss) {
  const code  = playerLobby.get(ws.id);
  if (!code) return;
  playerLobby.delete(ws.id);

  const lobby = lobbies.get(code);
  if (!lobby) return;
  lobby.players.delete(ws.id);

  if (lobby.players.size === 0) {
    clearInterval(lobby.timer);
    lobbies.delete(code);
    return;
  }

  if (lobby.hostId === ws.id) {
    const next   = lobby.players.values().next().value;
    next.isHost  = true;
    lobby.hostId = next.id;
  }

  broadcast(wss, code, { type: 'PLAYER_LEFT', players: scoreboard(lobby), hostId: lobby.hostId });

  // If a player disconnects mid-question and everyone remaining has answered, advance
  if (lobby.state === 'QUESTION') {
    const allDone = [...lobby.players.values()].every(p => p.hasAnswered);
    if (allDone) {
      clearInterval(lobby.timer);
      revealAndAdvance(wss, lobby);
    }
  }
}

module.exports = { handleMessage, handleDisconnect };
