export type PlayerStatus = 'JOINED' | 'LEFT' | 'WINNER' | 'LOSER';

export interface Player {
  id: number;
  name: string;
  score: number;
  status: PlayerStatus;
}

export type GameStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NOT_STARTED';

export interface Game {
  id: number;
  name: string;
  players: Player[];
  startedAt: string | null;
  endedAt: string | null;
  status: GameStatus;
  roomSize: number;
}

export type GameState = 'LOBBY' | 'WAITING' | 'PLAYING' | 'ENDED';

export interface BoxClaimData {
  claimed: boolean;
  boxIndex: number;
  playerId?: number;
  allBoxes?: Record<string, string>;
  gameOver?: boolean;
  isTie?: boolean;
  tiedPlayerIds?: string[];
  winnerId?: string | number | null;
  losers?: Player[];
  scores?: Record<string, number>;
}
