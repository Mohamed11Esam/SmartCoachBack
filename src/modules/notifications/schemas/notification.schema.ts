import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
    // Messages
    MESSAGE = 'message',

    // Coach-Client
    CLIENT_REQUEST = 'client_request',
    REQUEST_ACCEPTED = 'request_accepted',
    REQUEST_REJECTED = 'request_rejected',

    // Sessions/Schedule
    SESSION_BOOKED = 'session_booked',
    SESSION_CONFIRMED = 'session_confirmed',
    SESSION_CANCELED = 'session_canceled',
    SESSION_REMINDER = 'session_reminder',
    SESSION_STARTING = 'session_starting',

    // Plans & Progress
    PLAN_UPDATE = 'plan_update',
    PLAN_ASSIGNED = 'plan_assigned',
    GOAL = 'goal',
    PROGRESS_MILESTONE = 'progress_milestone',

    // Payments
    PAYMENT_SUCCESS = 'payment_success',
    PAYMENT_FAILED = 'payment_failed',
    SUBSCRIPTION_EXPIRING = 'subscription_expiring',

    // System
    SYSTEM = 'system',
    WELCOME = 'welcome',
    COACH_VERIFIED = 'coach_verified',
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
    data?: Record<string, any>;

    @Prop({ default: false })
    read: boolean;

    @Prop()
    readAt?: Date;

    @Prop()
    actionUrl?: string; // Deep link for mobile
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
