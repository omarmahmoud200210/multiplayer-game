import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameRepo } from './game.repo';
import { PlayerModule } from 'src/player/player.module';

@Module({
    imports: [PlayerModule],
    providers: [GameGateway, GameService, GameRepo],
})
export class GameModule {}
