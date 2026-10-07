import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProgressLogDocument = ProgressLog & Document;

@Schema({ timestamps: true })
export class ProgressLog extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Plan', required: false })
    planId?: Types.ObjectId;

    @Prop({ required: false })
    workoutId?: string;

    @Prop({ required: false })
    workoutTitle?: string;

    @Prop({ required: true })
    date: Date;

    @Prop({ type: String, required: false })
    exerciseId?: string;

    @Prop({ type: String, required: true })
    exerciseName: string;

    @Prop({ type: Number, default: 1 })
    sets: number;

    @Prop({ type: Number, default: 0 })
    reps: number;

    @Prop({ type: Number, default: 0 })
    weight: number; // in kg

    @Prop({ type: Number, default: 0 })
    volume: number; // calculated total kg

    @Prop({ type: Number, min: 1, max: 10, default: 8.0 })
    rpe?: number; // Rate of Perceived Exertion

    @Prop({ type: Number, default: 0 })
    durationMinutes?: number;

    @Prop({ type: Number, default: 0 })
    caloriesBurned?: number;

    @Prop({ type: String })
    notes?: string;

    @Prop({ type: Boolean, default: true })
    completed: boolean;
}

export const ProgressLogSchema = SchemaFactory.createForClass(ProgressLog);
ProgressLogSchema.index({ userId: 1, date: -1 });
ProgressLogSchema.index({ exerciseName: 1 });
