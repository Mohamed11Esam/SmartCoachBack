import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FreeNutritionDocument = FreeNutrition & Document;

@Schema({ timestamps: true })
export class FreeNutrition {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;

    @Prop()
    imageUrl: string;

    @Prop({ enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout', 'Other'] })
    mealType: string;

    @Prop([String])
    tags: string[]; // e.g., ['High Protein', 'Keto', 'Vegetarian', 'Low Carb']

    @Prop()
    calories: number;

    @Prop()
    protein: number;

    @Prop()
    carbs: number;

    @Prop()
    fats: number;

    @Prop()
    prepTime: number; // in minutes

    @Prop({ default: 0 })
    viewCount: number;
}

export const FreeNutritionSchema = SchemaFactory.createForClass(FreeNutrition);
