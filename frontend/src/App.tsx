import { useGame } from './context/GameContext';
import { LobbyScreen } from './components/LobbyScreen';
import { WaitingRoom } from './components/WaitingRoom';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';

function App() {
  const { gameState } = useGame();

  const renderContent = () => {
    switch (gameState) {
      case 'LOBBY':
        return <LobbyScreen />;
      case 'WAITING':
        return <WaitingRoom />;
      case 'PLAYING':
        return <GameBoard />;
      case 'ENDED':
        return (
          <>
            <GameBoard />
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 100
            }}>
              <GameOver />
            </div>
          </>
        );
      default:
        return <LobbyScreen />;
    }
  };

  return (
    <>
      {renderContent()}
    </>
  );
}

export default App;
