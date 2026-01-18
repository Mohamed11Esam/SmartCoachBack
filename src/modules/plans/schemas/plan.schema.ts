import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlanDocument = Plan & Document;

@Schema()
export class ScheduledExercise {
    @Prop({ required: true })
    exerciseId: string; // Reference to master Exercise collection

    @Prop()
    sets: number;

    @Prop()
    reps: number;

    @Prop()
    weight: number;
}

@Schema()
export class PlanDay {
    @Prop({ required: true })
    dayNumber: number;

    @Prop([ScheduledExercise])
    exercises: ScheduledExercise[];

    @Prop()
    meals: any[]; // Simplified for now
}

@Schema({ timestamps: true })
export class Plan {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    coachId: Types.ObjectId;

    @Prop({ required: true, enum: ['active', 'archived'], default: 'active' })
    status: string;

    @Prop({ required: true, default: 1 })
    versionNumber: number;

    @Prop([PlanDay])
    days: PlanDay[];

    @Prop()
    goal: string;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
