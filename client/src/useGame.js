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
  connected:      false,
};

function reduce(state, msg) {
  switch (msg.type) {
    case 'LOBBY_CREATED':
      return { ...state, screen: 'lobby', myId: msg.playerId, isHost: true, lobbyCode: msg.code, settings: msg.settings, players: msg.players, error: null };
    case 'JOINED_LOBBY':
      return { ...state, screen: 'lobby', myId: msg.playerId, isHost: false, lobbyCode: msg.code, settings: msg.settings, players: msg.players, hostId: msg.hostId, error: null };
    case 'PLAYER_JOINED':
      return { ...state, players: msg.players };
    case 'PLAYER_LEFT': {
      const newHostId = msg.hostId ?? state.hostId;
      return { ...state, players: msg.players, hostId: newHostId, isHost: newHostId === state.myId };
    }
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
  const wsRef         = useRef(null);
  const reconnectRef  = useRef(null);
  const intentionalRef = useRef(false);
  const [state, setState] = useState(initial);

  const connect = useCallback(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => setState(s => ({ ...s, connected: true, error: null }));

    ws.onmessage = (e) => {
      try { setState(s => reduce(s, JSON.parse(e.data))); } catch {}
    };

    ws.onclose = () => {
      const intentional = intentionalRef.current;
      intentionalRef.current = false;
      if (intentional) {
        // User chose to leave — reconnect immediately and go home
        setState({ ...initial });
        reconnectRef.current = setTimeout(connect, 50);
      } else {
        // Unexpected drop — show reconnecting message and retry
        setState({ ...initial, connected: false, error: 'Connection lost — reconnecting…' });
        reconnectRef.current = setTimeout(connect, 2000);
      }
    };

    ws.onerror = () => {};
  }, []);

  const send = useCallback((msg) => {
    if (msg.type === 'LEAVE') {
      intentionalRef.current = true;
      wsRef.current?.close();
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { state, send };
}
