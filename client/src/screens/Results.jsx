import { useState } from 'react';

const MEDALS = ['🥇', '🥈', '🥉'];

const GRADE = [
  [90, '🏆', 'Incredible!'],
  [70, '🎉', 'Well played!'],
  [50, '👍', 'Not bad!'],
  [30, '📚', 'Keep practicing!'],
  [ 0, '😅', 'Better luck next time!'],
];

const DIFF_COLOR = { easy: '#4ade80', medium: '#fb923c', hard: '#f87171' };

export default function Results({ state, send }) {
  const { scoreboard, isHost, myId, settings, totalQuestions, questionHistory } = state;
  const [showReview, setShowReview] = useState(false);

  const myEntry  = scoreboard.find(p => p.id === myId);
  const maxScore = scoreboard[0]?.score || 1;

  // Grade based on actual correct count (server now sends p.correct)
  const myCorrect = myEntry?.correct ?? 0;
  const pct       = totalQuestions > 0 ? Math.round((myCorrect / totalQuestions) * 100) : 0;
  const [, emoji, title] = GRADE.find(([threshold]) => pct >= threshold) ?? GRADE.at(-1);

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: 32, paddingBottom: 40 }}>
      <div className="card" style={{ maxWidth: 580 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>{emoji}</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e2e8f0' }}>{title}</h2>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>
            {myCorrect} / {totalQuestions} correct · Final Scoreboard
          </p>
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
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: i === 0 ? 'var(--yellow)' : 'var(--text)', textAlign: 'right', minWidth: 56 }}>
                    {settings.scoring === 'speed' ? p.score.toLocaleString() : p.score}
                    <div style={{ color: 'var(--muted-2)', fontSize: '0.72rem', fontWeight: 400 }}>
                      {settings.scoring === 'speed'
                        ? `${p.correct ?? 0}/${totalQuestions} ✓`
                        : `/ ${totalQuestions}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {isHost ? (
          <button className="btn btn-primary" onClick={() => send({ type: 'PLAY_AGAIN' })}>
            Play Again
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '8px 0' }}>
            Waiting for host to start a new game…
          </div>
        )}

        {/* Question review */}
        {questionHistory.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => setShowReview(v => !v)}
              style={{
                width: '100%', padding: '10px 16px', background: 'var(--surface)',
                border: '1.5px solid var(--border)', borderRadius: 12,
                color: 'var(--muted)', fontSize: '0.88rem', fontFamily: 'inherit',
                cursor: 'pointer', fontWeight: 600, textAlign: 'left',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>Review Questions ({questionHistory.length})</span>
              <span>{showReview ? '▲' : '▼'}</span>
            </button>

            {showReview && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {questionHistory.map((q, idx) => (
                  <div key={idx} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <span style={{
                        flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                        background: q.iGotIt ? '#16a34a' : '#dc2626',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: 'white',
                      }}>
                        {q.iGotIt ? '✓' : '✗'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted-2)', fontWeight: 600, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span>Q{idx + 1}</span>
                          <span style={{ color: DIFF_COLOR[q.difficulty] ?? 'var(--muted-2)', textTransform: 'capitalize' }}>{q.difficulty}</span>
                          <span style={{ color: 'var(--muted-2)' }}>{q.category}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.5 }}>{q.question}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {q.answers.map(ans => {
                        const isCorrect = ans === q.correctAnswer;
                        return (
                          <div key={ans} style={{
                            padding: '7px 12px', borderRadius: 8, fontSize: '0.85rem',
                            background: isCorrect ? 'rgba(22,163,74,0.15)' : 'transparent',
                            border: `1px solid ${isCorrect ? '#16a34a' : 'var(--border)'}`,
                            color: isCorrect ? '#4ade80' : 'var(--muted)',
                            fontWeight: isCorrect ? 600 : 400,
                          }}>
                            {isCorrect && '✓ '}{ans}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
