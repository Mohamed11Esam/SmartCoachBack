import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProgressLog extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
    planId: Types.ObjectId;

    @Prop({ required: true })
    date: Date;

    @Prop({ type: String, required: true })
    exerciseName: string;

    @Prop({ type: Number })
    sets: number;

    @Prop({ type: Number })
    reps: number;

    @Prop({ type: Number })
    weight: number;

    @Prop({ type: String })
    notes: string;

    @Prop({ type: Boolean, default: true })
    completed: boolean;
}

export const ProgressLogSchema = SchemaFactory.createForClass(ProgressLog);
