import { Injectable } from '@nestjs/common';
import { PlayerRepo } from './player.repo';
import { PlayerStatus } from '@prisma/client';

@Injectable()
export class PlayerService {
    constructor(private readonly playerRepo: PlayerRepo) {}

    async createPlayer(name: string) {
        return this.playerRepo.createPlayer(name);
    }

    async updatePlayer(playerId: number, score: number, status: PlayerStatus) {
        return this.playerRepo.updatePlayerScore(playerId, score);
    }
}
