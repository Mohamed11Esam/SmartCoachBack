import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClientRequestDocument = ClientRequest & Document;

@Schema({ timestamps: true })
export class ClientRequest {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    clientId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    coachId: Types.ObjectId;

    @Prop({
        required: true,
        enum: ['pending', 'accepted', 'rejected', 'canceled'],
        default: 'pending'
    })
    status: string;

    @Prop()
    message?: string; // Client's message when requesting

    @Prop()
    rejectionReason?: string; // Coach's reason for rejection

    @Prop({ enum: ['online', 'in-person', 'both'], default: 'online' })
    trainingType: string;

    @Prop()
    respondedAt?: Date;
}

export const ClientRequestSchema = SchemaFactory.createForClass(ClientRequest);
ClientRequestSchema.index({ clientId: 1, coachId: 1 });
ClientRequestSchema.index({ coachId: 1, status: 1 });
ClientRequestSchema.index({ clientId: 1, status: 1 });
