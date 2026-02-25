import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { getFrontendOrigins } from '../common/config/frontend-origin';

type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

type RealtimeUser = {
  id: string;
  role: Role;
  restaurantId: string | null;
};

@WebSocketGateway({
  cors: {
    origin: getFrontendOrigins(),
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractAccessTokenFromCookies(
        client.handshake.headers.cookie,
      );
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret:
          process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          role: true,
          restaurantId: true,
        },
      });

      if (!user) {
        client.disconnect(true);
        return;
      }

      const realtimeUser: RealtimeUser = {
        id: user.id,
        role: user.role,
        restaurantId: user.restaurantId,
      };

      client.data.user = realtimeUser;

      if (user.role === Role.STUDENT) {
        await client.join(this.studentRoom(user.id));
        return;
      }

      if (user.role === Role.RESTAURANT_ADMIN) {
        if (!user.restaurantId) {
          client.disconnect(true);
          return;
        }

        await client.join(this.restaurantRoom(user.restaurantId));
        return;
      }

      if (user.role === Role.SUPER_ADMIN) {
        await client.join(this.superAdminRoom());
        return;
      }

      client.disconnect(true);
    } catch (error) {
      this.logger.warn(
        `Rejected websocket connection: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as RealtimeUser | undefined;
    if (!user) {
      return;
    }

    this.logger.debug(`Socket disconnected for user ${user.id}`);
  }

  emitOrderNew(restaurantId: string, payload: unknown) {
    this.server.to(this.restaurantRoom(restaurantId)).emit('order:new', payload);
  }

  emitOrderStatusChanged(
    restaurantId: string,
    studentId: string,
    payload: unknown,
  ) {
    this.server
      .to(this.restaurantRoom(restaurantId))
      .emit('order:statusChanged', payload);
    this.server.to(this.studentRoom(studentId)).emit('order:statusChanged', payload);
  }

  emitNotificationCreated(
    userId: string,
    role: Role,
    payload: unknown,
    restaurantId?: string | null,
  ) {
    if (role === Role.STUDENT) {
      this.server.to(this.studentRoom(userId)).emit('notification:new', payload);
      return;
    }

    if (role === Role.SUPER_ADMIN) {
      this.server.to(this.superAdminRoom()).emit('notification:new', payload);
      return;
    }

    if (role === Role.RESTAURANT_ADMIN && restaurantId) {
      this.server
        .to(this.restaurantRoom(restaurantId))
        .emit('notification:new', payload);
    }
  }

  private extractAccessTokenFromCookies(cookieHeader?: string): string | null {
    if (!cookieHeader) {
      return null;
    }

    const parsed = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('access_token='));

    if (!parsed) {
      return null;
    }

    const token = parsed.slice('access_token='.length);
    return token || null;
  }

  private restaurantRoom(restaurantId: string) {
    return `restaurant:${restaurantId}`;
  }

  private studentRoom(userId: string) {
    return `student:${userId}`;
  }

  private superAdminRoom() {
    return 'super-admin';
  }
}
