import { useState, useEffect, useRef } from 'react';

const CIRCUMFERENCE = 2 * Math.PI * 32;
const LETTERS = ['A', 'B', 'C', 'D'];

const DIFF_STYLE = {
  easy:   { bg: '#052e16', color: '#4ade80', border: '#166534' },
  medium: { bg: '#431407', color: '#fb923c', border: '#9a3412' },
  hard:   { bg: '#450a0a', color: '#f87171', border: '#991b1b' },
};

export default function Quiz({ state, send }) {
  const {
    question, answers, questionIndex, totalQuestions,
    timeLimit, lastCorrect, lastPoints,
    correctAnswer, playerResults, scoreboard,
    category, difficulty, myId, settings,
  } = state;

  const [timeLeft, setTimeLeft]           = useState(timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const timerRef = useRef(null);

  // Reset & start timer on new question
  useEffect(() => {
    setTimeLeft(timeLimit);
    setSelectedAnswer(null);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [questionIndex, timeLimit]);

  // Stop timer once player has answered or reveal arrived
  useEffect(() => {
    if (selectedAnswer !== null || correctAnswer !== null) {
      clearInterval(timerRef.current);
    }
  }, [selectedAnswer, correctAnswer]);

  function handleAnswer(ans) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(ans);
    send({ type: 'ANSWER', answer: ans });
  }

  const fraction    = timeLeft / timeLimit;
  const dashOffset  = CIRCUMFERENCE * (1 - fraction);
  const timerColor  = fraction > 0.5 ? '#4ade80' : fraction > 0.25 ? '#fbbf24' : '#f87171';
  const diffStyle   = DIFF_STYLE[difficulty] ?? DIFF_STYLE.medium;

  const myScore = scoreboard.find(p => p.id === myId)?.score ?? 0;
  const myRank  = scoreboard.findIndex(p => p.id === myId) + 1;

  function answerStyle(ans) {
    if (correctAnswer !== null) {
      if (ans === correctAnswer)                        return { bg: '#052e16', border: '#22c55e', letterBg: '#16a34a' };
      if (ans === selectedAnswer && ans !== correctAnswer) return { bg: '#450a0a', border: '#ef4444', letterBg: '#dc2626' };
      return { bg: '#1e293b', border: '#334155', letterBg: '#334155' };
    }
    if (ans === selectedAnswer) return { bg: '#1e3a5f', border: '#3b82f6', letterBg: '#2563eb' };
    return { bg: '#1e293b', border: '#334155', letterBg: '#334155' };
  }

  return (
    <div className="screen" style={{ padding: '20px', justifyContent: 'flex-start', paddingTop: 32 }}>
      <div className="card" style={{ maxWidth: 680 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            Question {questionIndex + 1} / {totalQuestions}
          </span>
          <span style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '0.95rem' }}>
            {settings.scoring === 'speed' ? `${myScore.toLocaleString()} pts` : `${myScore} correct`}
            {scoreboard.length > 1 && myRank > 0 && ` · #${myRank}`}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--surface)', borderRadius: 2, marginBottom: 22, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: 2,
            width: `${(questionIndex / totalQuestions) * 100}%`, transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Timer + meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
          <div style={{ flexShrink: 0, position: 'relative', width: 76, height: 76 }}>
            <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
              <circle fill="none" stroke="#1e293b" strokeWidth="5" cx="38" cy="38" r="32" />
              <circle
                fill="none" stroke={timerColor} strokeWidth="5" strokeLinecap="round"
                cx="38" cy="38" r="32"
                style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: dashOffset, transition: 'stroke 0.5s' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 800, color: timerColor, transition: 'color 0.5s',
            }}>
              {timeLeft}
            </div>
          </div>

          <div>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20,
              background: diffStyle.bg, color: diffStyle.color, border: `1px solid ${diffStyle.border}`,
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
              marginBottom: 5, letterSpacing: '0.04em',
            }}>
              {difficulty}
            </div>
            <div style={{ color: 'var(--muted-2)', fontSize: '0.82rem' }}>{category}</div>
          </div>
        </div>

        {/* Question */}
        <div style={{ fontSize: '1.2rem', lineHeight: 1.65, marginBottom: 22, fontWeight: 500 }}>
          {question}
        </div>

        {/* Answer grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
          {answers.map((ans, i) => {
            const s = answerStyle(ans);
            return (
              <button
                key={ans}
                onClick={() => handleAnswer(ans)}
                disabled={selectedAnswer !== null}
                style={{
                  padding: '14px 12px', background: s.bg, border: `1.5px solid ${s.border}`,
                  borderRadius: 13, color: 'white', fontSize: '0.92rem',
                  cursor: selectedAnswer !== null ? 'default' : 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 10,
                  transition: 'all 0.15s', fontFamily: 'inherit', lineHeight: 1.4,
                }}
                onMouseEnter={e => { if (!selectedAnswer) { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#162032'; } }}
                onMouseLeave={e => { if (!selectedAnswer) { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = '#1e293b'; } }}
              >
                <span style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: 8,
                  background: s.letterBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  {LETTERS[i]}
                </span>
                <span>{ans}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback line */}
        <div style={{ marginTop: 16, textAlign: 'center', fontWeight: 700, fontSize: '1rem', minHeight: 26 }}>
          {selectedAnswer !== null && correctAnswer === null && (
            <span style={{ color: 'var(--muted)' }}>Waiting for others…</span>
          )}
          {correctAnswer !== null && (
            lastCorrect
              ? <span style={{ color: 'var(--green-l)' }}>
                  ✓ Correct!{settings.scoring === 'speed' && lastPoints > 0 ? ` +${lastPoints} pts` : ''}
                </span>
              : <span style={{ color: 'var(--red-l)' }}>✗ Wrong!</span>
          )}
        </div>

        {/* Reveal: per-player results */}
        {correctAnswer !== null && playerResults.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ color: 'var(--muted-2)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>
              Round Results
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...playerResults].sort((a, b) => b.points - a.points).map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'var(--surface)', borderRadius: 10,
                }}>
                  <span style={{ fontWeight: p.id === myId ? 700 : 400 }}>
                    {p.correct ? '✓' : '✗'} {p.nickname}
                    {p.id === myId && <span style={{ color: 'var(--muted-2)', fontSize: '0.78rem', fontWeight: 400 }}> (you)</span>}
                  </span>
                  <span style={{ color: p.points > 0 ? 'var(--green-l)' : 'var(--muted-2)', fontWeight: 600, fontSize: '0.88rem' }}>
                    {p.points > 0 ? `+${p.points}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Leave game */}
      <button
        onClick={() => send({ type: 'LEAVE' })}
        style={{
          marginTop: 14, background: 'none', border: 'none', color: 'var(--muted-2)',
          fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}
      >
        Leave game
      </button>

      <style>{`
        @media (max-width: 480px) {
          .answers-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
