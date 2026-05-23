import { useGame } from '../context/GameContext';
import { Trophy, RefreshCw, LogOut, Handshake } from 'lucide-react';

export function GameOver() {
  const { winnerInfo, player, game, resetGame, leaveGame } = useGame();

  if (!winnerInfo || !player) return null;

  const isTie = winnerInfo.isTie;
  const isWinner = !isTie && Number(winnerInfo.winnerId) === player.id;
  const winnerScore = winnerInfo.scores?.[Number(winnerInfo.winnerId)] || 0;

  const tiedPlayers = isTie
    ? game?.players.filter((p) => winnerInfo.tiedPlayerIds?.includes(String(p.id))) || []
    : [];
  const iAmTied = isTie && winnerInfo.tiedPlayerIds?.includes(String(player.id));
  const myScore = winnerInfo.scores?.[player.id] || 0;

  const renderIcon = () => {
    if (isTie) return <Handshake size={64} color="var(--color-p2)" />;
    if (isWinner) return <Trophy size={64} color="var(--color-p3)" />;
    return <Trophy size={64} color="var(--text-secondary)" />;
  };

  const renderTitle = () => {
    if (isTie) return iAmTied ? "It's a Tie!" : 'Game Over';
    return isWinner ? 'Victory!' : 'Game Over';
  };

  const renderMessage = () => {
    if (isTie && iAmTied) {
      const otherTiedNames = tiedPlayers
        .filter((p) => p.id !== player.id)
        .map((p) => p.name)
        .join(' & ');
      return `You tied with ${otherTiedNames} — both got ${myScore} boxes!`;
    }
    if (isTie && !iAmTied) {
      const tiedNames = tiedPlayers.map((p) => p.name).join(' & ');
      return `${tiedNames} tied with ${winnerInfo.scores?.[Number(tiedPlayers[0]?.id)] || 0} boxes each.`;
    }
    if (isWinner) return `You claimed the arena with ${winnerScore} boxes!`;
    return 'Better luck next time in the neon grid.';
  };

  const accentColor = isTie ? 'var(--color-p2)' : isWinner ? 'var(--color-p3)' : undefined;

  return (
    <div className="glass-panel animate-pop-in" style={{
      width: '100%',
      maxWidth: '450px',
      textAlign: 'center',
      border: accentColor ? `2px solid ${accentColor}` : '1px solid var(--border-color)',
      boxShadow: accentColor ? `0 0 30px ${accentColor}33` : undefined,
    }}>

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: accentColor ? `${accentColor}22` : 'rgba(255,255,255,0.05)',
          padding: '1.5rem',
          borderRadius: '50%',
        }}>
          {renderIcon()}
        </div>
      </div>

      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: accentColor || 'var(--text-primary)' }}>
        {renderTitle()}
      </h1>

      <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem' }}>
        {renderMessage()}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          className="btn btn-primary"
          onClick={resetGame}
          style={{ background: accentColor || 'var(--color-p1)' }}
        >
          <RefreshCw size={20} /> Play Again
        </button>
        <button className="btn" onClick={leaveGame}>
          <LogOut size={20} /> Leave Game
        </button>
      </div>
    </div>
  );
}
