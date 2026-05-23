import { Module } from '@nestjs/common';
import { PlayerRepo } from './player.repo';
import { PlayerService } from './player.service';

@Module({
    providers: [PlayerRepo, PlayerService],
    exports: [PlayerService, PlayerRepo],
})
export class PlayerModule {}
