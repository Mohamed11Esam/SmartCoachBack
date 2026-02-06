import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimeSlotDocument = TimeSlot & Document;

@Schema({ timestamps: true })
export class TimeSlot {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    coachId: Types.ObjectId;

    @Prop({ required: true })
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    @Prop({ required: true })
    startTime: string; // "09:00" (24h format)

    @Prop({ required: true })
    endTime: string; // "10:00"

    @Prop({ default: true })
    isRecurring: boolean; // Weekly recurring slot

    @Prop()
    specificDate?: Date; // For non-recurring, one-time slots

    @Prop({ default: true })
    isAvailable: boolean; // Coach can temporarily disable

    @Prop({ enum: ['online', 'in-person', 'both'], default: 'online' })
    sessionType: string;

    @Prop({ default: 60 })
    duration: number; // in minutes

    @Prop()
    notes?: string; // Coach's notes about this slot
}

export const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);
TimeSlotSchema.index({ coachId: 1, dayOfWeek: 1 });
TimeSlotSchema.index({ coachId: 1, specificDate: 1 });
