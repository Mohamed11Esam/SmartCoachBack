import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CoachClientDocument = CoachClient & Document;

@Schema({ timestamps: true })
export class CoachClient {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    clientId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    coachId: Types.ObjectId;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ enum: ['online', 'in-person', 'both'], default: 'online' })
    trainingType: string;

    @Prop({ default: 0 })
    progressPercentage: number;

    @Prop()
    lastActivityAt?: Date;

    @Prop()
    notes?: string; // Coach's private notes about client

    @Prop()
    startDate: Date;

    @Prop()
    endDate?: Date;
}

export const CoachClientSchema = SchemaFactory.createForClass(CoachClient);
CoachClientSchema.index({ coachId: 1, isActive: 1 });
CoachClientSchema.index({ clientId: 1, isActive: 1 });
CoachClientSchema.index({ coachId: 1, clientId: 1 }, { unique: true });
