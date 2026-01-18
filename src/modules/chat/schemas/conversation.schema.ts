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
    lastMessage: string;

    @Prop()
    lastMessageAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
