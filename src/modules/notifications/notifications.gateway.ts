import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { verify, type JwtPayload } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

type BalanceUpdatedEvent = {
  userId: string;
  amount: number;
  hash: string;
  sourceAccount: string;
  assetCode?: string;
  memo?: string;
  timestamp: string;
};

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*' },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server; // use default types instead of any to avoid lint warnings

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(@ConnectedSocket() client: Socket): void {
    const token = this.extractToken(client);

    if (!token) {
      this.logger.warn(`Socket ${client.id} rejected: missing token`);
      client.disconnect(true);
      return;
    }

    const userId = this.verifyAndExtractUserId(token);

    if (!userId) {
      this.logger.warn(`Socket ${client.id} rejected: invalid token`);
      client.disconnect(true);
      return;
    }

    (client.data as { userId?: string }).userId = userId;
    void client.join(this.userRoom(userId));
    this.logger.log(`Socket ${client.id} connected for user ${userId}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket): void {
    this.logger.log(`Socket ${client.id} disconnected`);
  }

  emitBalanceUpdated(event: BalanceUpdatedEvent): void {
    this.server.to(this.userRoom(event.userId)).emit('balance.updated', event);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token as string | undefined;

    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return authToken;
    }

    const authHeader = client.handshake.headers.authorization;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    return null;
  }

  private verifyAndExtractUserId(token: string): string | null {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      this.logger.error('JWT_SECRET is not configured');
      return null;
    }

    try {
      const decoded = verify(token, secret);

      if (typeof decoded === 'string') {
        return null;
      }

      return this.userIdFromPayload(decoded);
    } catch (err: unknown) {
      this.logger.debug(
        `Token verification failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  private userIdFromPayload(payload: JwtPayload): string | null {
    if (typeof payload.sub === 'string' && payload.sub.trim().length > 0) {
      return payload.sub;
    }

    const userId = payload.userId as string | undefined;
    if (typeof userId === 'string' && userId.trim().length > 0) {
      return userId;
    }

    return null;
  }
}
