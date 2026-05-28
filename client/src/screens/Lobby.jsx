import { useState } from 'react';

const CATEGORIES = [
  { value: '',           label: 'Any / Surprise me' },
  { value: 'general',   label: 'General Knowledge' },
  { value: 'science',   label: 'Science & Nature' },
  { value: 'history',   label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'sports',    label: 'Sports' },
  { value: 'movies',    label: 'Movies & TV' },
  { value: 'music',     label: 'Music' },
  { value: 'technology',label: 'Technology' },
  { value: 'literature',label: 'Literature' },
  { value: 'food',      label: 'Food & Drink' },
  { value: 'art',       label: 'Art & Culture' },
  { value: 'videogames',label: 'Video Games' },
];

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4','#84cc16'];

export default function Lobby({ state, send }) {
  const { lobbyCode, players, settings, isHost, isGenerating, error, myId } = state;
  const [copied,     setCopied]     = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  function copy() {
    navigator.clipboard.writeText(lobbyCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyLink() {
    const url = `${window.location.origin}/?join=${lobbyCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function update(key, value) {
    send({ type: 'UPDATE_SETTINGS', settings: { ...settings, [key]: value } });
  }

  function startGame() {
    send({ type: 'START_GAME' });
  }

  const catLabel = CATEGORIES.find(c => c.value === settings.category)?.label ?? 'Any';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', background: 'var(--bg)' }}>

      {/* Code header */}
      <div style={{ textAlign: 'center', marginBottom: 24, width: '100%', maxWidth: 900 }}>
        <div style={{ color: 'var(--muted-2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
          Lobby Code
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <span style={{ fontSize: '3.2rem', fontWeight: 900, letterSpacing: '0.18em', color: '#60a5fa', fontFamily: 'monospace' }}>
            {lobbyCode}
          </span>
          <button onClick={copy} style={{
            padding: '8px 16px', border: '1.5px solid var(--border)', borderRadius: 10,
            background: copied ? '#16a34a' : 'var(--surface)', color: copied ? '#fff' : 'var(--muted)',
            cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>
          <button onClick={copyLink} style={{
            padding: '8px 16px', border: '1.5px solid var(--border)', borderRadius: 10,
            background: copiedLink ? '#16a34a' : 'var(--surface)', color: copiedLink ? '#fff' : 'var(--muted)',
            cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            {copiedLink ? '✓ Copied' : '🔗 Copy Link'}
          </button>
        </div>
        <div style={{ color: 'var(--muted-2)', fontSize: '0.82rem', marginTop: 5 }}>
          Share the code or link with friends to join
        </div>
      </div>

      {/* Main grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 260px) 1fr',
        gap: 18,
        width: '100%',
        maxWidth: 900,
        alignItems: 'start',
      }}
        className="lobby-grid"
      >
        {/* Players panel */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>
            Players ({players.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {players.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, color: 'white',
                }}>
                  {p.nickname[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.nickname}
                    {p.id === myId && <span style={{ color: 'var(--muted-2)', fontWeight: 400, fontSize: '0.75rem' }}>(you)</span>}
                  </div>
                  {p.isHost && <div style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>HOST</div>}
                </div>
                {isHost && p.id !== myId && (
                  <button
                    onClick={() => send({ type: 'KICK', playerId: p.id })}
                    title="Kick player"
                    style={{
                      width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--muted-2)', cursor: 'pointer',
                      fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#450a0a'; e.currentTarget.style.borderColor = '#991b1b'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted-2)'; }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings / waiting panel */}
        <div className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column' }}>
          {isHost ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 22, fontSize: '1.05rem' }}>Game Settings</div>

              <div className="form-group">
                <label className="label">Category</label>
                <select value={settings.category} onChange={e => update('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Difficulty</label>
                <div className="pills">
                  {[['', 'Any'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].map(([v, l]) => (
                    <div key={v} className={`pill ${settings.difficulty === v ? 'active' : ''}`} onClick={() => update('difficulty', v)}>{l}</div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Number of Questions</label>
                <div className="pills">
                  {['5','10','15','20','30'].map(v => (
                    <div key={v} className={`pill ${String(settings.amount) === v ? 'active' : ''}`} onClick={() => update('amount', Number(v))}>{v}</div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Time per Question</label>
                <div className="pills">
                  {[['10','10s'],['20','20s'],['30','30s'],['45','45s']].map(([v, l]) => (
                    <div key={v} className={`pill ${String(settings.timePerQuestion) === v ? 'active' : ''}`} onClick={() => update('timePerQuestion', Number(v))}>{l}</div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Scoring</label>
                <div className="pills">
                  <div className={`pill ${settings.scoring === 'speed'  ? 'active' : ''}`} onClick={() => update('scoring', 'speed')}>⚡ Speed-based</div>
                  <div className={`pill ${settings.scoring === 'simple' ? 'active' : ''}`} onClick={() => update('scoring', 'simple')}>✓ Simple (1pt)</div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={startGame} disabled={isGenerating} style={{ marginTop: 4 }}>
                {isGenerating ? <><span className="spinner" />Generating questions…</> : 'Start Game →'}
              </button>
              {error && <p className="error">{error}</p>}
              <button
                className="btn btn-secondary"
                onClick={() => send({ type: 'LEAVE' })}
                style={{ marginTop: 8, opacity: 0.7 }}
              >
                Leave Lobby
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>
                {isGenerating ? '🤖' : '⏳'}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>
                {isGenerating ? 'AI is generating questions…' : 'Waiting for host to start…'}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 24 }}>
                {isGenerating ? 'This takes a few seconds' : 'The host is configuring the game'}
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => send({ type: 'LEAVE' })}
                style={{ marginBottom: 16, opacity: 0.7 }}
              >
                Leave Lobby
              </button>

              {/* Read-only settings */}
              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', textAlign: 'left' }}>
                <div style={{ color: 'var(--muted-2)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>
                  Current Settings
                </div>
                {[
                  ['Category',   catLabel],
                  ['Difficulty', settings.difficulty || 'Any'],
                  ['Questions',  settings.amount],
                  ['Time',       `${settings.timePerQuestion}s`],
                  ['Scoring',    settings.scoring === 'speed' ? '⚡ Speed' : '✓ Simple'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{k}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .lobby-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
