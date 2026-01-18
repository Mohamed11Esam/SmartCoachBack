import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MetricLogDocument = MetricLog & Document;

@Schema({ timestamps: true })
export class MetricLog {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true })
    date: Date;

    @Prop()
    weight: number;

    @Prop()
    bodyFatPercentage: number;

    @Prop({ type: Object })
    measurements: {
        chest?: number;
        waist?: number;
        hips?: number;
        arms?: number;
        thighs?: number;
    };

    @Prop([String])
    photos: string[];
}

export const MetricLogSchema = SchemaFactory.createForClass(MetricLog);
