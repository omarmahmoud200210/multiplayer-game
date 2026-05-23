import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { GameService } from './game.service';
import {
    StartGameDto,
    JoinGameDto,
    ClaimBoxDto,
    ResetGameDto,
    LeaveGameDto,
    ReconnectGameDto,
}
from './dto/index.dto';

@WebSocketGateway({ path: '/game' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private rooms = new Map<number, Set<WebSocket>>();

    // tracks which player/game each socket belongs to
    private socketMeta = new Map<WebSocket, { playerId: number; gameId: number }>();

    // pending leave timers keyed by playerId — cancelled if client reconnects in time
    private reconnectTimers = new Map<number, NodeJS.Timeout>();

    private readonly RECONNECT_GRACE_MS = 20_000;

    constructor(private readonly gameService: GameService) {}

    handleConnection(client: WebSocket) {
        console.log('Client connected');
    }

    handleDisconnect(client: WebSocket) {
        console.log('Client disconnected');

        const meta = this.socketMeta.get(client);
        this.socketMeta.delete(client);
        this.rooms.forEach((clients) => clients.delete(client));

        if (!meta) return;

        const { playerId, gameId } = meta;

        // give the client grace period to reconnect before treating this as an intentional leave
        const timer = setTimeout(async () => {
            this.reconnectTimers.delete(playerId);
            // guard against a race where the new socket's reconnect-game message arrived
            // before this disconnect event was processed — if the player is already back, skip
            const alreadyReconnected = [...this.socketMeta.values()].some(m => m.playerId === playerId);
            if (alreadyReconnected) return;
            await this.gameService.leaveGame({ gameId, playerId });
            this.broadcastToRoom(gameId, 'player-left', { playerId });
        }, this.RECONNECT_GRACE_MS);

        this.reconnectTimers.set(playerId, timer);
    }

    private addToRoom(gameId: number, client: WebSocket) {
        if (!this.rooms.has(gameId)) {
            this.rooms.set(gameId, new Set());
        }

        this.rooms.get(gameId)?.add(client);
    }

    private broadcastToRoom(gameId: number, event: string, data: unknown) {
        const clients = this.rooms.get(gameId);
        if (!clients) return;
        const message = JSON.stringify({ event, data });
        clients.forEach((c) => {
            if (c.readyState === WebSocket.OPEN) {
                c.send(message);
            }
        });
    }

    @SubscribeMessage('start-game')
    async handleStartGame(
        @MessageBody() data: StartGameDto,
        @ConnectedSocket() client: WebSocket,
    ) {
        const result = await this.gameService.startGame(data);
        this.addToRoom(result.game.id, client);
        this.socketMeta.set(client, { playerId: result.player.id, gameId: result.game.id });
        client.send(JSON.stringify({ event: 'game-created', data: result }));
    }

    @SubscribeMessage('join-game')
    async handleJoinGame(
        @MessageBody() data: JoinGameDto,
        @ConnectedSocket() client: WebSocket,
    ) {
        const result = await this.gameService.joinGame(data);
        this.addToRoom(data.gameId, client);
        this.socketMeta.set(client, { playerId: result.player.id, gameId: data.gameId });

        client.send(JSON.stringify({ event: 'game-joined', data: result }));

        this.broadcastToRoom(data.gameId, 'player-joined', result.game);

        if (result.started) {
            this.broadcastToRoom(data.gameId, 'game-started', result.game);
        }
    }

    @SubscribeMessage('claim-box')
    async handleClaimBox(
        @MessageBody() data: ClaimBoxDto,
        @ConnectedSocket() client: WebSocket,
    ) {
        const result = await this.gameService.boxesClaiming(data);
        const event = result.gameOver ? 'game-over' : 'box-claimed';
        this.broadcastToRoom(data.gameId, event, result);
    }

    @SubscribeMessage('reset-game')
    async handleResetGame(
        @MessageBody() data: ResetGameDto,
        @ConnectedSocket() client: WebSocket,
    ) {
        const result = await this.gameService.resetGame(data);

        // notify old room players to join the new game
        this.broadcastToRoom(data.gameId, 'game-reset', { newGameId: result.game.id });

        // move the resetter into the new room, discard the old room
        this.rooms.delete(data.gameId);
        this.addToRoom(result.game.id, client);
    }

    @SubscribeMessage('reconnect-game')
    async handleReconnect(
        @MessageBody() data: ReconnectGameDto,
        @ConnectedSocket() client: WebSocket,
    ) {
        const pendingTimer = this.reconnectTimers.get(data.playerId);

        if (pendingTimer) {
            // client came back within the grace period — cancel the leave timer
            clearTimeout(pendingTimer);
            this.reconnectTimers.delete(data.playerId);

            this.addToRoom(data.gameId, client);
            this.socketMeta.set(client, { playerId: data.playerId, gameId: data.gameId });

            const result = await this.gameService.reconnectGame(data);
            client.send(JSON.stringify({ event: 'game-reconnected', data: result }));
            this.broadcastToRoom(data.gameId, 'player-reconnected', { playerId: data.playerId });
            return;
        }

        // no pending timer — check DB in case the server restarted but player is still in the game
        const result = await this.gameService.reconnectGame(data);
        if (!result) {
            client.send(JSON.stringify({ event: 'reconnect-failed', data: { reason: 'not-in-game' } }));
            return;
        }

        this.addToRoom(data.gameId, client);
        this.socketMeta.set(client, { playerId: data.playerId, gameId: data.gameId });
        client.send(JSON.stringify({ event: 'game-reconnected', data: result }));
    }

    @SubscribeMessage('leave-game')
    async handleLeaveGame(
        @MessageBody() data: LeaveGameDto,
        @ConnectedSocket() client: WebSocket,
    ) {
        // cancel grace period if the client explicitly leaves
        const pendingTimer = this.reconnectTimers.get(data.playerId);
        if (pendingTimer) {
            clearTimeout(pendingTimer);
            this.reconnectTimers.delete(data.playerId);
        }

        const result = await this.gameService.leaveGame(data);
        this.rooms.get(data.gameId)?.delete(client);
        this.socketMeta.delete(client);
        this.broadcastToRoom(data.gameId, 'player-left', result);
    }
}