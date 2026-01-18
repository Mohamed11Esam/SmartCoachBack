import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GoalDocument = Goal & Document;

export enum GoalType {
    WEIGHT = 'Weight',
    WORKOUT_COUNT = 'WorkoutCount',
    CALORIES_BURNED = 'CaloriesBurned',
    STREAK = 'Streak',
    OTHER = 'Other'
}

export enum GoalStatus {
    IN_PROGRESS = 'InProgress',
    COMPLETED = 'Completed',
    FAILED = 'Failed'
}

@Schema({ timestamps: true })
export class Goal {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true, enum: GoalType })
    type: string;

    @Prop({ required: true })
    targetValue: number;

    @Prop({ default: 0 })
    currentValue: number;

    @Prop()
    deadline: Date;

    @Prop({ default: GoalStatus.IN_PROGRESS, enum: GoalStatus })
    status: string;

    @Prop()
    description: string;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
