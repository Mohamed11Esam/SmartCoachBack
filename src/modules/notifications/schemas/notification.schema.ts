import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
    MESSAGE = 'message',
    PLAN_UPDATE = 'plan_update',
    GOAL = 'goal',
    SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class Notification {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true, enum: NotificationType })
    type: NotificationType;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    body: string;

    @Prop({ type: Object })
    data?: Record<string, any>; // e.g., { chatId, planId, goalId }

    @Prop({ default: false })
    read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
