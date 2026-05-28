import { useState } from 'react';

const MODE = { HOME: 'home', CREATE: 'create', JOIN: 'join' };

export default function Home({ state, send }) {
  const [mode, setMode]         = useState(MODE.HOME);
  const [nickname, setNickname] = useState('');
  const [code, setCode]         = useState('');

  function goBack() { setMode(MODE.HOME); setNickname(''); setCode(''); }

  function handleCreate(e) {
    e.preventDefault();
    const name = nickname.trim();
    if (!name) return;
    send({ type: 'CREATE_LOBBY', nickname: name });
  }

  function handleJoin(e) {
    e.preventDefault();
    const name = nickname.trim();
    const c    = code.trim().toUpperCase();
    if (!name || c.length !== 4) return;
    send({ type: 'JOIN_LOBBY', nickname: name, code: c });
  }

  if (mode === MODE.HOME) {
    return (
      <div className="screen">
        <div className="card" style={{ maxWidth: 460 }}>
          <div className="logo">
            <h1>TriviaGuessr</h1>
            <p>Multiplayer trivia powered by AI</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" style={{ margin: 0 }} onClick={() => setMode(MODE.CREATE)}>
              Create Game
            </button>
            <button
              className="btn btn-secondary"
              style={{ margin: 0, border: '1.5px solid #334155' }}
              onClick={() => setMode(MODE.JOIN)}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === MODE.CREATE) {
    return (
      <div className="screen">
        <div className="card" style={{ maxWidth: 420 }}>
          <div className="logo">
            <h1>TriviaGuessr</h1>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>Create a Game</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Your Nickname</label>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Enter your name…"
                maxLength={24}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" type="submit">Create Lobby →</button>
          </form>
          <button className="btn btn-secondary" onClick={goBack}>← Back</button>
          {state.error && <p className="error">{state.error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="card" style={{ maxWidth: 420 }}>
        <div className="logo">
          <h1>TriviaGuessr</h1>
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>Join a Game</h2>
        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label className="label">Your Nickname</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Enter your name…"
              maxLength={24}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="label">Lobby Code</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={4}
              style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '1.6rem', textAlign: 'center', fontWeight: 800 }}
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={nickname.trim().length === 0 || code.trim().length !== 4}
          >
            Join Game →
          </button>
        </form>
        <button className="btn btn-secondary" onClick={goBack}>← Back</button>
        {state.error && <p className="error">{state.error}</p>}
      </div>
    </div>
  );
}
