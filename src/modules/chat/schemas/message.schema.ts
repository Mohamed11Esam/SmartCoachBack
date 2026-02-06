import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
    @Prop({ required: true, type: Types.ObjectId, ref: 'Conversation' })
    conversationId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    senderId: Types.ObjectId;

    @Prop({ required: true })
    content: string;

    @Prop({ enum: ['text', 'image', 'file', 'audio', 'system'], default: 'text' })
    messageType: string;

    @Prop()
    fileUrl?: string;

    @Prop()
    fileName?: string;

    @Prop()
    fileSize?: number;

    @Prop({ default: false })
    isRead: boolean;

    @Prop()
    readAt?: Date;

    @Prop({ default: false })
    isDelivered: boolean;

    @Prop()
    deliveredAt?: Date;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop()
    deletedAt?: Date;

    @Prop()
    replyToId?: Types.ObjectId; // For reply feature
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
