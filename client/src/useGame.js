import { useRef, useState, useCallback, useEffect } from 'react';

const initial = {
  screen:         'home',
  myId:           null,
  isHost:         false,
  lobbyCode:      null,
  settings:       { category: '', difficulty: '', amount: 10, timePerQuestion: 20, scoring: 'speed' },
  players:        [],
  hostId:         null,
  question:       null,
  answers:        [],
  questionIndex:  0,
  totalQuestions: 0,
  timeLimit:      20,
  lastCorrect:    false,
  lastPoints:     0,
  correctAnswer:  null,
  playerResults:  [],
  scoreboard:     [],
  category:       '',
  difficulty:     '',
  isGenerating:   false,
  error:          null,
};

function reduce(state, msg) {
  switch (msg.type) {
    case 'LOBBY_CREATED':
      return { ...state, screen: 'lobby', myId: msg.playerId, isHost: true,  lobbyCode: msg.code, settings: msg.settings, players: msg.players, error: null };
    case 'JOINED_LOBBY':
      return { ...state, screen: 'lobby', myId: msg.playerId, isHost: false, lobbyCode: msg.code, settings: msg.settings, players: msg.players, hostId: msg.hostId, error: null };
    case 'PLAYER_JOINED':
    case 'PLAYER_LEFT':
      return { ...state, players: msg.players, hostId: msg.hostId ?? state.hostId };
    case 'SETTINGS_UPDATED':
      return { ...state, settings: msg.settings };
    case 'GENERATING_QUESTIONS':
      return { ...state, isGenerating: true, error: null };
    case 'QUESTION':
      return {
        ...state,
        screen: 'quiz', isGenerating: false,
        question: msg.question, answers: msg.answers,
        questionIndex: msg.questionIndex, totalQuestions: msg.total,
        timeLimit: msg.timeLimit, category: msg.category, difficulty: msg.difficulty,
        lastCorrect: false, lastPoints: 0, correctAnswer: null, playerResults: [],
      };
    case 'ANSWER_ACK':
      return { ...state, lastCorrect: msg.correct, lastPoints: msg.points };
    case 'REVEAL':
      return { ...state, correctAnswer: msg.correctAnswer, playerResults: msg.playerResults, scoreboard: msg.scoreboard };
    case 'GAME_OVER':
      return { ...state, screen: 'results', scoreboard: msg.scoreboard };
    case 'BACK_TO_LOBBY':
      return { ...state, screen: 'lobby', settings: msg.settings, players: msg.players, isGenerating: false, correctAnswer: null };
    case 'ERROR':
      return { ...state, error: msg.message, isGenerating: false };
    default:
      return state;
  }
}

export function useGame() {
  const wsRef = useRef(null);
  const [state, setState] = useState(initial);

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url   = `${proto}//${window.location.host}/ws`;
    const ws    = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try { setState(s => reduce(s, JSON.parse(e.data))); } catch {}
    };
    ws.onclose = () => setState(s => ({ ...s, error: 'Connection lost. Please refresh.' }));
    ws.onerror = () => setState(s => ({ ...s, error: 'WebSocket error. Please refresh.' }));

    return () => ws.close();
  }, []);

  return { state, send };
}
