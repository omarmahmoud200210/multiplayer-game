import { useGame } from '../context/GameContext';
import { Copy, Users } from 'lucide-react';
import { useState } from 'react';

export function WaitingRoom() {
  const { game, player } = useGame();
  const [copied, setCopied] = useState(false);

  if (!game || !player) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(game.id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPlayers = game.players?.length || 1;
  const maxPlayers = game.roomSize || 3;

  return (
    <div className="glass-panel animate-pop-in" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
      <div className="animate-pulse" style={{ marginBottom: '1.5rem' }}>
        <Users size={48} color="var(--color-p1)" style={{ margin: '0 auto' }} />
      </div>
      
      <h2>Waiting for Players...</h2>
      <p style={{ marginBottom: '2rem' }}>Share this Game ID with your friends to join.</p>

      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px dashed var(--color-p1)'
      }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          GAME ID
        </div>
        <div style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          color: 'var(--color-p1)',
          letterSpacing: '4px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {game.id}
          <button 
            onClick={handleCopy}
            className="btn"
            style={{ padding: '0.5rem', background: 'transparent', border: 'none' }}
            title="Copy ID"
          >
            <Copy size={24} color={copied ? 'var(--color-p3)' : 'var(--text-secondary)'} />
          </button>
        </div>
        {copied && <div style={{ fontSize: '0.8rem', color: 'var(--color-p3)', marginTop: '0.5rem' }}>Copied to clipboard!</div>}
      </div>

      <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Players Joined</span>
          <span style={{ color: 'var(--color-p1)', fontWeight: 'bold' }}>{currentPlayers} / {maxPlayers}</span>
        </div>
        
        {/* Simple progress bar */}
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${(currentPlayers / maxPlayers) * 100}%`, 
            height: '100%', 
            background: 'var(--color-p1)',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>
    </div>
  );
}
