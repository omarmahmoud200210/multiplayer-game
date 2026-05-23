import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Gamepad2, Users } from 'lucide-react';

export function LobbyScreen() {
  const { startGame, joinGame } = useGame();
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    startGame(name);
  };

  const handleJoin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !gameId.trim()) return;
    joinGame(name, Number(gameId));
  };

  return (
    <div className="glass-panel animate-pop-in" style={{ width: '100%', maxWidth: '400px' }}>
      <h1>Neon Grid</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem' }}>Enter the arena and claim your boxes.</p>

      <div className="form-group">
        <label htmlFor="playerName">Your Name</label>
        <input
          id="playerName"
          type="text"
          className="input-field"
          placeholder="e.g. Neo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {!isJoining ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>
            <Gamepad2 size={20} /> Create New Game
          </button>
          
          <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-secondary)' }}>
            — OR —
          </div>
          
          <button className="btn" onClick={() => setIsJoining(true)}>
            <Users size={20} /> Join Existing Game
          </button>
        </div>
      ) : (
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label htmlFor="gameId">Game ID</label>
            <input
              id="gameId"
              type="number"
              className="input-field"
              placeholder="e.g. 12"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={!name.trim() || !gameId.trim()}>
            Join Game
          </button>
          <button type="button" className="btn" onClick={() => setIsJoining(false)}>
            Back
          </button>
        </form>
      )}
    </div>
  );
}
