import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

interface ConnectedUser {
    userId: string;
    socketId: string;
    role: string;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers: Map<string, ConnectedUser> = new Map();

    constructor(
        private jwtService: JwtService,
        private chatService: ChatService,
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                client.emit('error', { message: 'No token provided' });
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            client.data.user = {
                userId: payload.sub,
                email: payload.email,
                role: payload.role,
            };

            // Join user's personal room for direct notifications
            client.join(`user-${payload.sub}`);

            // Track connected user
            this.connectedUsers.set(payload.sub, {
                userId: payload.sub,
                socketId: client.id,
                role: payload.role,
            });

            // Notify others that user is online
            this.server.emit('userOnline', { userId: payload.sub });

            console.log(`User connected: ${payload.sub} (${payload.email})`);
        } catch (e) {
            client.emit('error', { message: 'Invalid token' });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        if (client.data.user) {
            const userId = client.data.user.userId;
            this.connectedUsers.delete(userId);

            // Notify others that user is offline
            this.server.emit('userOffline', { userId });

            console.log(`User disconnected: ${userId}`);
        }
    }

    @SubscribeMessage('joinConversation')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() conversationId: string,
    ) {
        const userId = client.data.user.userId;

        // Verify user is part of this conversation
        try {
            await this.chatService.getConversationById(conversationId, userId);
            client.join(`conversation-${conversationId}`);

            // Update last seen
            await this.chatService.updateLastSeen(conversationId, userId);

            return { success: true, conversationId };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    @SubscribeMessage('leaveConversation')
    handleLeaveConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() conversationId: string,
    ) {
        client.leave(`conversation-${conversationId}`);
        return { success: true };
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: SendMessageDto,
    ) {
        const userId = client.data.user.userId;

        try {
            const message = await this.chatService.createMessage(
                payload.conversationId,
                userId,
                payload,
            );

            // Populate sender info
            const populatedMessage = await message.populate('senderId', 'firstName lastName photoUrl');

            // Emit to all users in the conversation room
            this.server
                .to(`conversation-${payload.conversationId}`)
                .emit('newMessage', populatedMessage);

            // Also emit to specific users who might not be in the room
            const conversation = await this.chatService.getConversationById(
                payload.conversationId,
                userId,
            );

            const recipientId = conversation.coachId._id.toString() === userId
                ? conversation.customerId._id.toString()
                : conversation.coachId._id.toString();

            // Send notification to recipient's personal room
            this.server.to(`user-${recipientId}`).emit('messageNotification', {
                conversationId: payload.conversationId,
                message: populatedMessage,
            });

            return { success: true, message: populatedMessage };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() conversationId: string,
    ) {
        const userId = client.data.user.userId;

        try {
            const result = await this.chatService.markAsRead(conversationId, userId);

            // Notify the other user that messages were read
            this.server
                .to(`conversation-${conversationId}`)
                .emit('messagesRead', {
                    conversationId,
                    readBy: userId,
                    readAt: new Date(),
                });

            return { success: true, ...result };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string; isTyping: boolean },
    ) {
        const userId = client.data.user.userId;

        // Broadcast typing status to the conversation room
        client.to(`conversation-${payload.conversationId}`).emit('userTyping', {
            userId,
            isTyping: payload.isTyping,
        });

        return { success: true };
    }

    @SubscribeMessage('messageDelivered')
    async handleMessageDelivered(
        @ConnectedSocket() client: Socket,
        @MessageBody() messageId: string,
    ) {
        try {
            await this.chatService.markMessageAsDelivered(messageId);

            // Notify sender that message was delivered
            this.server.emit('deliveryReceipt', {
                messageId,
                deliveredAt: new Date(),
            });

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // Check if a user is online
    isUserOnline(userId: string): boolean {
        return this.connectedUsers.has(userId);
    }

    // Get online users
    getOnlineUsers(): string[] {
        return Array.from(this.connectedUsers.keys());
    }

    // Send notification to specific user
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user-${userId}`).emit(event, data);
    }
}
