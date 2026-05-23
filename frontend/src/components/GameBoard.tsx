import { useGame } from '../context/GameContext';
import { TOTAL_BOXES } from '../constants';
import './GameBoard.css';

const getPlayerColor = (index: number) => {
  const colors = ['var(--color-p1)', 'var(--color-p2)', 'var(--color-p3)'];
  return colors[index % colors.length];
};

export function GameBoard() {
  const { game, player, boxes, claimBox } = useGame();

  if (!game || !player) return null;

  const totalBoxes = TOTAL_BOXES;

  // Sort players by id to ensure consistent color assignment
  const sortedPlayers = [...(game.players || [])].sort((a, b) => a.id - b.id);
  
  // Create a quick lookup for player colors
  const playerColorMap = new Map<number, string>();
  sortedPlayers.forEach((p, index) => {
    playerColorMap.set(p.id, getPlayerColor(index));
  });

  const myColor = playerColorMap.get(player.id) || 'var(--text-primary)';

  // Calculate scores derived directly from claimed boxes
  const scores: Record<number, number> = {};
  Object.values(boxes).forEach((ownerIdStr) => {
    const ownerId = Number(ownerIdStr);
    scores[ownerId] = (scores[ownerId] || 0) + 1;
  });

  const renderBox = (index: number) => {
    const ownerIdStr = boxes[index];
    const isClaimed = !!ownerIdStr;
    const ownerId = isClaimed ? Number(ownerIdStr) : null;
    const boxColor = ownerId ? playerColorMap.get(ownerId) : 'transparent';
    const isMine = ownerId === player.id;

    return (
      <button
        key={index}
        className={`game-box ${isClaimed ? 'claimed' : ''} ${isMine ? 'mine' : ''}`}
        style={{ 
          backgroundColor: isClaimed ? boxColor : undefined,
          boxShadow: isClaimed ? `0 0 15px ${boxColor}` : undefined,
          borderColor: isClaimed ? boxColor : undefined,
        }}
        onClick={() => !isClaimed && claimBox(index)}
        disabled={isClaimed}
      />
    );
  };

  return (
    <div className="glass-panel animate-pop-in" style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Scoreboard Header */}
      <div className="scoreboard">
        {sortedPlayers.map((p) => {
          const color = playerColorMap.get(p.id);
          const isMe = p.id === player.id;
          const score = scores[p.id] || 0;
          return (
            <div key={p.id} className="score-card" style={{ borderBottomColor: color }}>
              <div className="score-name" style={{ color: isMe ? '#fff' : 'var(--text-secondary)' }}>
                {p.name} {isMe && '(You)'}
              </div>
              <div className="score-value" style={{ color }}>{score}</div>
            </div>
          );
        })}
      </div>

      {/* The 4x4 Grid */}
      <div className="game-grid">
        {Array.from({ length: totalBoxes }).map((_, i) => renderBox(i))}
      </div>

      <div style={{ marginTop: '2rem', color: myColor, fontWeight: 600 }}>
        You are playing as {player.name}
      </div>
    </div>
  );
}
