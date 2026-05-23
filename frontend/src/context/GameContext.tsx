import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Game, Player, GameState, BoxClaimData } from '../types/game';
import { TOTAL_BOXES } from '../constants';

const SESSION_KEY = 'game_session';

interface SessionData {
  gameId: number;
  playerId: number;
}

function saveSession(gameId: number, playerId: number) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ gameId, playerId }));
}

function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

interface GameContextType {
  socket: WebSocket | null;
  gameState: GameState;
  player: Player | null;
  game: Game | null;
  boxes: Record<string, string>;
  winnerInfo: BoxClaimData | null;
  startGame: (playerName: string) => void;
  joinGame: (playerName: string, gameId: number) => void;
  claimBox: (boxIndex: number) => void;
  resetGame: () => void;
  leaveGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [player, setPlayer] = useState<Player | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [boxes, setBoxes] = useState<Record<string, string>>({});
  const [winnerInfo, setWinnerInfo] = useState<BoxClaimData | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const didResetRef = useRef(false);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/game');

    ws.onopen = () => {
      console.log('Connected to game server');

      const session = loadSession();
      if (session) {
        ws.send(JSON.stringify({
          event: 'reconnect-game',
          data: { gameId: session.gameId, playerId: session.playerId },
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const { event: type, data } = JSON.parse(event.data);

        switch (type) {
          case 'game-created':
            playerRef.current = data.player;
            setPlayer(data.player);
            setGame(data.game);
            setGameState('WAITING');
            saveSession(data.game.id, data.player.id);
            break;

          case 'game-joined':
            playerRef.current = data.player;
            setPlayer(data.player);
            setGame(data.game);
            setGameState(data.started ? 'PLAYING' : 'WAITING');
            saveSession(data.game.id, data.player.id);
            break;

          case 'player-joined':
            setGame(data);
            break;

          case 'game-started':
            setGame(data);
            setGameState('PLAYING');
            setBoxes({});
            setWinnerInfo(null);
            break;

          case 'box-claimed':
            if (data.allBoxes) setBoxes(data.allBoxes);
            break;

          case 'game-over':
            if (data.allBoxes) setBoxes(data.allBoxes);
            setWinnerInfo(data);
            setGameState('ENDED');
            break;

          case 'game-reset':
            setBoxes({});
            setWinnerInfo(null);
            if (didResetRef.current) {
              didResetRef.current = false;
              setGame((prev) => prev ? { ...prev, id: data.newGameId, players: [], status: 'NOT_STARTED' } : prev);
              setGameState('WAITING');
              // update session with the new game id
              const session = loadSession();
              if (session) saveSession(data.newGameId, session.playerId);
            } else if (playerRef.current) {
              ws.send(JSON.stringify({
                event: 'join-game',
                data: { playerName: playerRef.current.name, gameId: data.newGameId },
              }));
            }
            break;

          case 'game-reconnected': {
            const reconnectedGame: Game = data.game;
            const session = loadSession();
            const reconnectedPlayer = session
              ? reconnectedGame.players.find((p) => p.id === session.playerId) ?? null
              : null;

            playerRef.current = reconnectedPlayer;
            setPlayer(reconnectedPlayer);
            setGame(reconnectedGame);
            setBoxes(data.allBoxes ?? {});

            if (reconnectedGame.status === 'ACTIVE') setGameState('PLAYING');
            else if (reconnectedGame.status === 'COMPLETED') setGameState('ENDED');
            else setGameState('WAITING');
            break;
          }

          case 'reconnect-failed':
            clearSession();
            setGameState('LOBBY');
            break;

          case 'player-left': {
            // fired both by explicit leave (data.player.id) and by the grace-period timer (data.playerId)
            const leftId = data.player?.id ?? data.playerId;
            setGame((prev) =>
              prev ? { ...prev, players: prev.players.filter((p) => p.id !== leftId) } : prev
            );
            break;
          }

          case 'player-reconnected':
            setGame((prev) => {
              if (!prev) return prev;
              const alreadyListed = prev.players.some((p) => p.id === data.playerId);
              return alreadyListed ? prev : { ...prev, players: [...prev.players] };
            });
            break;
        }
      } catch (err) {
        console.error('Error parsing message', err);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from game server');
    };

    wsRef.current = ws;
    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const startGame = (playerName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'start-game', data: { playerName } }));
    }
  };

  const joinGame = (playerName: string, gameId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'join-game', data: { playerName, gameId } }));
    }
  };

  const claimBox = (boxIndex: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && player && game) {
      wsRef.current.send(JSON.stringify({
        event: 'claim-box',
        data: { gameId: game.id, playerId: player.id, boxIndex, totalBoxes: TOTAL_BOXES },
      }));
    }
  };

  const resetGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN && player && game) {
      didResetRef.current = true;
      wsRef.current.send(JSON.stringify({
        event: 'reset-game',
        data: { gameId: game.id, playerId: player.id },
      }));
    }
  };

  const leaveGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN && player && game) {
      wsRef.current.send(JSON.stringify({
        event: 'leave-game',
        data: { gameId: game.id, playerId: player.id },
      }));
      clearSession();
      setGameState('LOBBY');
      setGame(null);
      setPlayer(null);
      playerRef.current = null;
      setBoxes({});
      setWinnerInfo(null);
    }
  };

  return (
    <GameContext.Provider value={{
      socket,
      gameState,
      player,
      game,
      boxes,
      winnerInfo,
      startGame,
      joinGame,
      claimBox,
      resetGame,
      leaveGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
