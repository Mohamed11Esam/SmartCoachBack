import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    coachId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    customerId: Types.ObjectId;

    @Prop()
    lastMessage?: string;

    @Prop()
    lastMessageAt?: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    lastMessageSenderId?: Types.ObjectId;

    @Prop({ default: 0 })
    coachUnreadCount: number;

    @Prop({ default: 0 })
    customerUnreadCount: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    coachLastSeenAt?: Date;

    @Prop()
    customerLastSeenAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ coachId: 1, customerId: 1 }, { unique: true });
ConversationSchema.index({ coachId: 1, lastMessageAt: -1 });
ConversationSchema.index({ customerId: 1, lastMessageAt: -1 });
