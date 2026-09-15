import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiSessionDocument = AiSession & Document;

@Schema({ _id: false })
export class AiSessionMessage {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true, enum: ['user', 'assistant'] })
    sender: 'user' | 'assistant';

    @Prop({ required: true })
    content: string;

    @Prop({ required: true })
    timestamp: string;
}

export const AiSessionMessageSchema = SchemaFactory.createForClass(AiSessionMessage);

@Schema({ timestamps: true })
export class AiSession {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, default: 'New Consultation' })
    title: string;

    @Prop({ type: [AiSessionMessageSchema], default: [] })
    messages: AiSessionMessage[];

    @Prop({ default: true })
    isActive: boolean;
}

export const AiSessionSchema = SchemaFactory.createForClass(AiSession);
AiSessionSchema.index({ userId: 1, updatedAt: -1 });
