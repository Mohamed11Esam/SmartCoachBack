import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    ) { }

    async createMessage(conversationId: string, senderId: string, content: string) {
        const message = await this.messageModel.create({
            conversationId,
            senderId,
            content,
        });
        await this.conversationModel.findByIdAndUpdate(conversationId, {
            lastMessage: content,
            lastMessageAt: new Date(),
        });
        return message;
    }

    async getMessages(conversationId: string) {
        return this.messageModel.find({ conversationId }).sort({ createdAt: 1 }).exec();
    }

    async findOrCreateConversation(coachId: string, customerId: string) {
        let conversation = await this.conversationModel.findOne({ coachId, customerId });
        if (!conversation) {
            conversation = await this.conversationModel.create({ coachId, customerId });
        }
        return conversation;
    }

    async getUserConversations(userId: string) {
        return this.conversationModel.find({
            $or: [{ coachId: userId }, { customerId: userId }]
        }).sort({ lastMessageAt: -1 }).exec();
    }
}
