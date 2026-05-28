const MEDALS = ['🥇', '🥈', '🥉'];

const GRADE = [
  [90, '🏆', 'Incredible!'],
  [70, '🎉', 'Well played!'],
  [50, '👍', 'Not bad!'],
  [30, '📚', 'Keep practicing!'],
  [ 0, '😅', 'Better luck next time!'],
];

export default function Results({ state, send }) {
  const { scoreboard, isHost, myId, settings, totalQuestions } = state;

  const myEntry   = scoreboard.find(p => p.id === myId);
  const maxScore  = scoreboard[0]?.score || 1;

  // Compute accuracy for the grade (requires correct count — approximate from scoreboard rank)
  const myRank    = scoreboard.findIndex(p => p.id === myId) + 1;
  const pct       = myRank === 1 ? 100 : myRank === scoreboard.length ? 0 : Math.round((1 - (myRank - 1) / scoreboard.length) * 100);
  const [, emoji, title] = GRADE.find(([threshold]) => pct >= threshold) ?? GRADE.at(-1);

  return (
    <div className="screen">
      <div className="card" style={{ maxWidth: 560 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>{emoji}</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e2e8f0' }}>{title}</h2>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>Final Scoreboard</p>
        </div>

        {/* Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {scoreboard.map((p, i) => {
            const isMe     = p.id === myId;
            const barWidth = maxScore > 0 ? `${(p.score / maxScore) * 100}%` : '0%';
            return (
              <div key={p.id} style={{
                padding: '14px 16px', borderRadius: 14,
                background: isMe ? 'rgba(59,130,246,0.1)' : 'var(--surface)',
                border: `1.5px solid ${isMe ? '#3b82f6' : 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: '1.3rem', minWidth: 32, textAlign: 'center' }}>
                    {MEDALS[i] ?? `${i + 1}.`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: isMe ? 700 : 500, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.nickname}
                      {isMe && <span style={{ color: 'var(--muted-2)', fontWeight: 400, fontSize: '0.75rem' }}>(you)</span>}
                      {p.isHost && <span style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '0.72rem' }}>HOST</span>}
                    </div>
                    {/* Score bar */}
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: barWidth, background: i === 0 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#2563eb,#7c3aed)', borderRadius: 2, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: i === 0 ? 'var(--yellow)' : 'var(--text)', textAlign: 'right' }}>
                    {settings.scoring === 'speed' ? p.score.toLocaleString() : p.score}
                    <div style={{ color: 'var(--muted-2)', fontSize: '0.72rem', fontWeight: 400 }}>
                      {settings.scoring === 'speed' ? 'pts' : `/ ${totalQuestions}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {isHost ? (
          <>
            <button className="btn btn-primary" onClick={() => send({ type: 'PLAY_AGAIN' })}>
              Play Again
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '8px 0' }}>
            Waiting for host to start a new game…
          </div>
        )}

      </div>
    </div>
  );
}
