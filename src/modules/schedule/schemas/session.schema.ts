import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    coachId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    clientId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'TimeSlot' })
    timeSlotId?: Types.ObjectId; // Reference to recurring slot if applicable

    @Prop({ required: true })
    scheduledDate: Date; // The actual date of the session

    @Prop({ required: true })
    startTime: string; // "09:00"

    @Prop({ required: true })
    endTime: string; // "10:00"

    @Prop({ default: 60 })
    duration: number; // in minutes

    @Prop({ enum: ['online', 'in-person'], default: 'online' })
    sessionType: string;

    @Prop({
        required: true,
        enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'canceled', 'no-show'],
        default: 'scheduled'
    })
    status: string;

    @Prop()
    title?: string; // e.g., "Crossfit training"

    @Prop()
    notes?: string; // Session notes/agenda

    @Prop()
    coachNotes?: string; // Private coach notes after session

    @Prop()
    clientNotes?: string; // Client feedback

    @Prop()
    meetingLink?: string; // For online sessions (Zoom, Google Meet, etc.)

    @Prop()
    location?: string; // For in-person sessions

    @Prop()
    canceledAt?: Date;

    @Prop()
    canceledBy?: string; // 'coach' or 'client'

    @Prop()
    cancelReason?: string;

    @Prop()
    completedAt?: Date;

    // Reminder tracking
    @Prop({ default: false })
    reminder60Sent?: boolean;

    @Prop({ default: false })
    reminder30Sent?: boolean;

    @Prop({ default: false })
    startingNowSent?: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ coachId: 1, scheduledDate: 1 });
SessionSchema.index({ clientId: 1, scheduledDate: 1 });
SessionSchema.index({ coachId: 1, status: 1 });
SessionSchema.index({ scheduledDate: 1, status: 1 });
