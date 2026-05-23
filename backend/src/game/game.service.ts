import { Injectable } from '@nestjs/common';
import { GameStatus } from '@prisma/client';
import { RedisService } from 'src/redis/redis.service';
import { PlayerRepo } from 'src/player/player.repo';
import { GameRepo } from './game.repo';
import { PlayerStatus } from '@prisma/client';
import {
    StartGameDto,
    JoinGameDto,
    ClaimBoxDto,
    ResetGameDto,
    LeaveGameDto,
    ReconnectGameDto,
}
from './dto/index.dto';

@Injectable()
export class GameService {
    constructor(
        private readonly gameRepo: GameRepo,
        private readonly playerRepo: PlayerRepo,
        private readonly redisService: RedisService,
    ) {}

    async startGame({ playerName }: StartGameDto) {
        const player = await this.playerRepo.createPlayer(playerName);
        const game = await this.gameRepo.createGame(player.id);

        await this.redisService.client.del(`game:${game.id}:boxes`);

        return { player, game };
    }

    async joinGame({ gameId, playerName }: JoinGameDto) {
        const player = await this.playerRepo.createPlayer(playerName);
        await this.gameRepo.joinGame(gameId, player.id);

        const game = await this.gameRepo.getGameWithPlayers(gameId);

        if (game?.players.length === game?.roomSize) {
            await this.gameRepo.updateGame(gameId, {
                status: GameStatus.ACTIVE,
                startedAt: new Date(),
            });
            return { player, game, started: true };
        }

        return { player, game, started: false };
    }

    async boxesClaiming({ gameId, playerId, boxIndex, totalBoxes }: ClaimBoxDto) {
        const key = `game:${gameId}:boxes`;

        await this.redisService.client.hset(key, String(boxIndex), String(playerId));

        const allBoxes = await this.redisService.client.hgetall(key);
        const claimedCount = Object.keys(allBoxes).length;

        if (claimedCount < totalBoxes) {
            return { gameOver: false, boxIndex, playerId, allBoxes };
        }

        // all boxes claimed — but if two players claimed the final boxes at the
        // same time, both requests reach here. SET NX is atomic in Redis, so only
        // the first one wins the flag and runs the end-game logic; the other bails
        // out and is broadcast as a normal box claim (no duplicate game-over).
        const wonFinalize = await this.redisService.client.set(`game:${gameId}:over`, '1', 'NX');
        if (!wonFinalize) {
            return { gameOver: false, boxIndex, playerId, allBoxes };
        }

        // calculate scores
        const scores: Record<string, number> = {};
        for (const ownerId of Object.values(allBoxes)) {
            scores[ownerId] = (scores[ownerId] ?? 0) + 1;
        }

        // persist scores to DB
        const game = await this.gameRepo.getGameWithPlayers(gameId);
        for (const player of game?.players || []) {
            await this.playerRepo.updatePlayerScore(player.id, scores[String(player.id)] ?? 0);
        }

        // mark game as completed
        await this.gameRepo.updateGame(gameId, {
            status: GameStatus.COMPLETED,
            endedAt: new Date(),
        });

        // detect winner or tie
        const maxScore = Math.max(...Object.values(scores));
        const tiedPlayerIds = Object.entries(scores)
            .filter(([, score]) => score === maxScore)
            .map(([id]) => id);

        const isTie = tiedPlayerIds.length > 1;

        if (isTie) {
            for (const player of game?.players || []) {
                await this.playerRepo.updatePlayerStatus(player.id, PlayerStatus.LOSER);
            }
            return { gameOver: true, allBoxes, scores, isTie: true, tiedPlayerIds, winnerId: null };
        }

        const winnerId = tiedPlayerIds[0];

        await this.playerRepo.updatePlayerStatus(Number(winnerId), PlayerStatus.WINNER);
        for (const player of game?.players || []) {
            if (player.id !== Number(winnerId)) {
                await this.playerRepo.updatePlayerStatus(player.id, PlayerStatus.LOSER);
            }
        }

        return { gameOver: true, allBoxes, scores, isTie: false, winnerId, tiedPlayerIds: [], losers: game?.players.filter((p) => p.id !== Number(winnerId)) };
    }

    async resetGame({ gameId, playerId }: ResetGameDto) {
        await this.redisService.client.del(`game:${gameId}:boxes`);
        const game = await this.gameRepo.createGame(playerId);
        return { game, started: false };
    }

    async reconnectGame({ gameId, playerId }: ReconnectGameDto) {
        const game = await this.gameRepo.getGameWithPlayers(gameId);
        const isInGame = game?.players.some((p) => p.id === playerId);
        if (!isInGame) return null;

        const key = `game:${gameId}:boxes`;
        const allBoxes = await this.redisService.client.hgetall(key);

        return { game, allBoxes };
    }

    async leaveGame ({ gameId, playerId }: LeaveGameDto) {
        await this.playerRepo.updatePlayerScore(playerId, 0);
        await this.playerRepo.updatePlayerStatus(playerId, PlayerStatus.LEFT);
        await this.gameRepo.removePlayerFromGame(gameId, playerId);
        const player = await this.playerRepo.getPlayerById(playerId);
        return { message: `Player ${player?.name} left the game`, player };
    }
} 