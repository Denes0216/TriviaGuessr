import { useGame } from './useGame';
import Home    from './screens/Home';
import Lobby   from './screens/Lobby';
import Quiz    from './screens/Quiz';
import Results from './screens/Results';

const SCREENS = { home: Home, lobby: Lobby, quiz: Quiz, results: Results };

export default function App() {
  const { state, send } = useGame();

  if (!state.connected) {
    return (
      <div className="screen">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, margin: '0 auto 20px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#60a5fa',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            {state.error || 'Connecting…'}
          </p>
        </div>
      </div>
    );
  }

  const Screen = SCREENS[state.screen] ?? Home;
  return <Screen state={state} send={send} />;
}
