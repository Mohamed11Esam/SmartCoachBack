import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('conversations')
    async getConversations(@Request() req) {
        return this.chatService.getUserConversations(req.user.userId);
    }

    @Get('conversations/:id/messages')
    async getMessages(@Param('id') id: string) {
        return this.chatService.getMessages(id);
    }
}
