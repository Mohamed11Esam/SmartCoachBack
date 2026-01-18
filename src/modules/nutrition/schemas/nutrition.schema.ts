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

    @Prop([String])
    tags: string[];

    @Prop()
    calories: number;

    @Prop()
    protein: number;

    @Prop()
    carbs: number;

    @Prop()
    fats: number;
}

export const FreeNutritionSchema = SchemaFactory.createForClass(FreeNutrition);
