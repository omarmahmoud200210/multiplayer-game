import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private _client: Redis;

    onModuleInit() {
        const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
        this._client = new Redis(url);

        this._client.on('connect', () => this.logger.log('Redis connected'));
        this._client.on('error', (err) => this.logger.error('Redis error', err));
    }

    async onModuleDestroy() {
        await Promise.all([ this._client?.quit() ]);
    }

    get client(): Redis {
        return this._client;
    }
}