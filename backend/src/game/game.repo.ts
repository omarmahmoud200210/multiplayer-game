import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Game, GameStatus } from "@prisma/client";

@Injectable()
export class GameRepo {
    constructor(private prisma: PrismaService) { }

    async createGame(playerId: number): Promise<Game> {
        return this.prisma.game.create({
            data: {
                name: `Game-${Date.now()}`,
                players: {
                    connect: { id: playerId },
                },
                status: GameStatus.NOT_STARTED,
            },
        });
    }

    async getGameWithPlayers(gameId: number) {
        return this.prisma.game.findUnique({
            where: { id: gameId },
            include: { players: true },
        });
    }

    async joinGame(gameId: number, playerId: number): Promise<Game> {
        return this.prisma.game.update({
            where: { id: gameId },
            data: {
                players: {
                    connect: { id: playerId },
                },
            },
        });
    }

    async updateGame(gameId: number, data: Partial<Pick<Game, 'status' | 'startedAt' | 'endedAt'>>): Promise<Game> {
        return this.prisma.game.update({
            where: { id: gameId },
            data,
        });
    }

    async removePlayerFromGame(gameId: number, playerId: number): Promise<Game> {
        return this.prisma.game.update({
            where: { id: gameId },
            data: {
                players: {
                    disconnect: { id: playerId },
                },
            },
        });
    }
}