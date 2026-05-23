import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [PrismaModule, RedisModule, GameModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
