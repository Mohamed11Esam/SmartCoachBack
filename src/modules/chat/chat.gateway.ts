import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        private chatService: ChatService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.data.user = payload;
            client.join(`user-${payload.sub}`);
        } catch (e) {
            client.disconnect();
        }
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string; content: string },
    ) {
        const userId = client.data.user.sub;
        const message = await this.chatService.createMessage(
            payload.conversationId,
            userId,
            payload.content,
        );
        this.server.to(payload.conversationId).emit('newMessage', message);
        return message;
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
        client.join(roomId);
    }
}
