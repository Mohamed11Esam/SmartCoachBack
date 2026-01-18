import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
    @Prop({ required: true, type: Types.ObjectId, ref: 'CoachProfile' })
    coachId: Types.ObjectId;

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true, min: 1, max: 5 })
    rating: number;

    @Prop()
    comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
