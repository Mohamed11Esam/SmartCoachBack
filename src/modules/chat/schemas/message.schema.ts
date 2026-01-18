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

    @Prop({ default: false })
    read: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
