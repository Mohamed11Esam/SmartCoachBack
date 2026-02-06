import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FreeWorkoutDocument = FreeWorkout & Document;

@Schema({ timestamps: true })
export class FreeWorkout {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop()
    videoUrl: string;

    @Prop()
    thumbnailUrl: string;

    @Prop({ required: true, enum: ['Beginner', 'Intermediate', 'Advanced'] })
    difficulty: string;

    @Prop({ enum: ['Strength', 'Cardio', 'Yoga', 'Stretching', 'HIIT', 'CrossFit', 'Pilates', 'Other'] })
    category: string;

    @Prop([String])
    tags: string[];

    @Prop()
    duration: number; // in minutes

    @Prop()
    calories: number;

    @Prop({ default: 0 })
    viewCount: number;
}

export const FreeWorkoutSchema = SchemaFactory.createForClass(FreeWorkout);
