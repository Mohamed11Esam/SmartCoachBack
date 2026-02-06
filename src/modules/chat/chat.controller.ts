import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartConversationDto, SendMessageDto } from './dto/chat.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    // ══════════════════════════════════════════════════════════════════════════════
    // CONVERSATIONS
    // ══════════════════════════════════════════════════════════════════════════════

    @Get('conversations')
    @ApiOperation({ summary: 'Get all conversations for current user' })
    async getConversations(@Request() req) {
        return this.chatService.getUserConversations(req.user.userId);
    }

    @Post('conversations')
    @ApiOperation({ summary: 'Start a new conversation or get existing one' })
    async startConversation(@Request() req, @Body() dto: StartConversationDto) {
        return this.chatService.startConversation(
            req.user.userId,
            req.user.role,
            dto,
        );
    }

    @Get('conversations/:id')
    @ApiOperation({ summary: 'Get conversation details' })
    async getConversation(@Request() req, @Param('id') id: string) {
        return this.chatService.getConversationById(id, req.user.userId);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // MESSAGES
    // ══════════════════════════════════════════════════════════════════════════════

    @Get('conversations/:id/messages')
    @ApiOperation({ summary: 'Get messages in a conversation' })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of messages to fetch (default 50)' })
    @ApiQuery({ name: 'before', required: false, description: 'Fetch messages before this message ID (for pagination)' })
    async getMessages(
        @Request() req,
        @Param('id') id: string,
        @Query('limit') limit?: string,
        @Query('before') before?: string,
    ) {
        return this.chatService.getMessages(
            id,
            req.user.userId,
            limit ? parseInt(limit) : 50,
            before,
        );
    }

    @Post('conversations/:id/messages')
    @ApiOperation({ summary: 'Send a message (REST API alternative to WebSocket)' })
    async sendMessage(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: Omit<SendMessageDto, 'conversationId'>,
    ) {
        return this.chatService.createMessage(id, req.user.userId, {
            ...dto,
            conversationId: id,
        } as SendMessageDto);
    }

    @Post('conversations/:id/read')
    @ApiOperation({ summary: 'Mark all messages in conversation as read' })
    async markAsRead(@Request() req, @Param('id') id: string) {
        return this.chatService.markAsRead(id, req.user.userId);
    }

    @Delete('messages/:messageId')
    @ApiOperation({ summary: 'Delete a message (soft delete)' })
    async deleteMessage(@Request() req, @Param('messageId') messageId: string) {
        return this.chatService.deleteMessage(messageId, req.user.userId);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // UNREAD COUNT
    // ══════════════════════════════════════════════════════════════════════════════

    @Get('unread-count')
    @ApiOperation({ summary: 'Get total unread message count' })
    async getUnreadCount(@Request() req) {
        const count = await this.chatService.getTotalUnreadCount(req.user.userId);
        return { unreadCount: count };
    }
}
