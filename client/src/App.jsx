import { useGame } from './useGame';
import Home    from './screens/Home';
import Lobby   from './screens/Lobby';
import Quiz    from './screens/Quiz';
import Results from './screens/Results';

const SCREENS = { home: Home, lobby: Lobby, quiz: Quiz, results: Results };

export default function App() {
  const { state, send } = useGame();
  const Screen = SCREENS[state.screen] ?? Home;
  return <Screen state={state} send={send} />;
}
