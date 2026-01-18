import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotificationDocument } from './schemas/notification.schema';

@WebSocketGateway({ cors: true })
export class NotificationsGateway {
    @WebSocketServer()
    server: Server;

    sendToUser(userId: string, notification: NotificationDocument): void {
        this.server.to(`user-${userId}`).emit('newNotification', {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            createdAt: (notification as any).createdAt,
        });
    }

    sendUnreadCount(userId: string, count: number): void {
        this.server.to(`user-${userId}`).emit('unreadCount', { count });
    }
}
