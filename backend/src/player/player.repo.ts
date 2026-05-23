import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Player, PlayerStatus } from "@prisma/client";

@Injectable()
export class PlayerRepo {
    constructor(private prisma: PrismaService) {}

    async createPlayer (name: string): Promise<Player> {
        return await this.prisma.player.create({
            data: {
                name,
            }
        })
    }

    async updatePlayerScore (playerId: number, score: number) {
        return await this.prisma.player.update({
            where: {
                id: playerId,
            },
            data: {
                score,
            }
        })
    }

    async updatePlayerStatus(playerId: number, status: PlayerStatus) {
        return await this.prisma.player.update({
            where: {
                id: playerId,
            },
            data: {
                status,
            }
        })
    }

    async getPlayerById(playerId: number): Promise<Player | null> {
        return this.prisma.player.findUnique({
            where: { id: playerId },
        });
    }
}