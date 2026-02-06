import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { SendMessageDto, StartConversationDto } from './dto/chat.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    // ══════════════════════════════════════════════════════════════════════════════
    // CONVERSATIONS
    // ══════════════════════════════════════════════════════════════════════════════

    async startConversation(
        userId: string,
        userRole: string,
        dto: StartConversationDto,
    ): Promise<ConversationDocument> {
        const coachId = userRole === 'Coach' ? userId : dto.recipientId;
        const customerId = userRole === 'Coach' ? dto.recipientId : userId;

        let conversation = await this.conversationModel.findOne({ coachId, customerId });

        if (!conversation) {
            conversation = await this.conversationModel.create({
                coachId,
                customerId,
                isActive: true,
            });
        }

        // Send initial message if provided
        if (dto.initialMessage) {
            await this.createMessage(conversation._id.toString(), userId, {
                conversationId: conversation._id.toString(),
                content: dto.initialMessage,
            });
        }

        return conversation;
    }

    async findOrCreateConversation(coachId: string, customerId: string): Promise<ConversationDocument> {
        let conversation = await this.conversationModel.findOne({ coachId, customerId });
        if (!conversation) {
            conversation = await this.conversationModel.create({ coachId, customerId });
        }
        return conversation;
    }

    async getUserConversations(userId: string): Promise<any[]> {
        const conversations = await this.conversationModel
            .find({
                $or: [{ coachId: userId }, { customerId: userId }],
                isActive: true,
            })
            .populate('coachId', 'firstName lastName photoUrl')
            .populate('customerId', 'firstName lastName photoUrl')
            .sort({ lastMessageAt: -1 })
            .exec();

        // Add unread count for current user
        return conversations.map(conv => {
            const isCoach = conv.coachId._id.toString() === userId;
            const unreadCount = isCoach ? conv.coachUnreadCount : conv.customerUnreadCount;
            const otherUser = isCoach ? conv.customerId : conv.coachId;

            return {
                _id: conv._id,
                otherUser,
                lastMessage: conv.lastMessage,
                lastMessageAt: conv.lastMessageAt,
                unreadCount,
                isCoach,
            };
        });
    }

    async getConversationById(
        conversationId: string,
        userId: string,
    ): Promise<ConversationDocument> {
        const conversation = await this.conversationModel
            .findById(conversationId)
            .populate('coachId', 'firstName lastName photoUrl email')
            .populate('customerId', 'firstName lastName photoUrl email')
            .exec();

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Verify user is part of conversation
        if (
            conversation.coachId._id.toString() !== userId &&
            conversation.customerId._id.toString() !== userId
        ) {
            throw new ForbiddenException('You are not part of this conversation');
        }

        return conversation;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // MESSAGES
    // ══════════════════════════════════════════════════════════════════════════════

    async createMessage(
        conversationId: string,
        senderId: string,
        dto: SendMessageDto,
    ): Promise<MessageDocument> {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Create message
        const message = await this.messageModel.create({
            conversationId,
            senderId,
            content: dto.content,
            messageType: dto.messageType || 'text',
            fileUrl: dto.fileUrl,
            fileName: dto.fileName,
            fileSize: dto.fileSize,
            replyToId: dto.replyToId,
        });

        // Update conversation
        const isCoach = conversation.coachId.toString() === senderId;
        const updateData: any = {
            lastMessage: dto.content,
            lastMessageAt: new Date(),
            lastMessageSenderId: senderId,
        };

        // Increment unread count for recipient
        if (isCoach) {
            updateData.$inc = { customerUnreadCount: 1 };
        } else {
            updateData.$inc = { coachUnreadCount: 1 };
        }

        await this.conversationModel.findByIdAndUpdate(conversationId, updateData);

        // Send push notification to recipient
        try {
            const recipientId = isCoach
                ? conversation.customerId.toString()
                : conversation.coachId.toString();
            const sender = await this.usersService.findById(senderId);

            if (sender) {
                const senderName = `${sender.firstName} ${sender.lastName}`;
                await this.notificationsService.notifyNewMessage(
                    recipientId,
                    senderName,
                    conversationId,
                    dto.content,
                );
            }
        } catch (error) {
            console.error('Failed to send new message notification:', error);
        }

        return message;
    }

    async getMessages(
        conversationId: string,
        userId: string,
        limit = 50,
        before?: string,
    ): Promise<MessageDocument[]> {
        // Verify user is part of conversation
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (
            conversation.coachId.toString() !== userId &&
            conversation.customerId.toString() !== userId
        ) {
            throw new ForbiddenException('You are not part of this conversation');
        }

        const query: any = {
            conversationId,
            isDeleted: false,
        };

        if (before) {
            query._id = { $lt: new Types.ObjectId(before) };
        }

        const messages = await this.messageModel
            .find(query)
            .populate('senderId', 'firstName lastName photoUrl')
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();

        return messages.reverse();
    }

    async markAsRead(
        conversationId: string,
        userId: string,
    ): Promise<{ markedCount: number }> {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        const isCoach = conversation.coachId.toString() === userId;

        // Mark all messages from the other person as read
        const otherUserId = isCoach ? conversation.customerId : conversation.coachId;

        const result = await this.messageModel.updateMany(
            {
                conversationId,
                senderId: otherUserId,
                isRead: false,
            },
            {
                isRead: true,
                readAt: new Date(),
            },
        );

        // Reset unread count
        if (isCoach) {
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                coachUnreadCount: 0,
                coachLastSeenAt: new Date(),
            });
        } else {
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                customerUnreadCount: 0,
                customerLastSeenAt: new Date(),
            });
        }

        return { markedCount: result.modifiedCount };
    }

    async markMessageAsDelivered(messageId: string): Promise<void> {
        await this.messageModel.findByIdAndUpdate(messageId, {
            isDelivered: true,
            deliveredAt: new Date(),
        });
    }

    async deleteMessage(
        messageId: string,
        userId: string,
    ): Promise<MessageDocument> {
        const message = await this.messageModel.findById(messageId);

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.senderId.toString() !== userId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = 'This message was deleted';

        return message.save();
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // UNREAD COUNTS
    // ══════════════════════════════════════════════════════════════════════════════

    async getTotalUnreadCount(userId: string): Promise<number> {
        const conversations = await this.conversationModel.find({
            $or: [{ coachId: userId }, { customerId: userId }],
            isActive: true,
        });

        let total = 0;
        for (const conv of conversations) {
            const isCoach = conv.coachId.toString() === userId;
            total += isCoach ? conv.coachUnreadCount : conv.customerUnreadCount;
        }

        return total;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // TYPING INDICATORS (handled via WebSocket, but tracked here for persistence)
    // ══════════════════════════════════════════════════════════════════════════════

    async updateLastSeen(conversationId: string, userId: string): Promise<void> {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) return;

        const isCoach = conversation.coachId.toString() === userId;

        if (isCoach) {
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                coachLastSeenAt: new Date(),
            });
        } else {
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                customerLastSeenAt: new Date(),
            });
        }
    }
}
