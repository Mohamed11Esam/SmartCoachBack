import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PromoCodeUsageDocument = PromoCodeUsage & Document;

@Schema({ timestamps: true })
export class PromoCodeUsage {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'PromoCode', required: true })
    promoCodeId: Types.ObjectId;

    @Prop({ required: true })
    orderId: string;

    @Prop({ required: true })
    discountAmount: number;
}

export const PromoCodeUsageSchema = SchemaFactory.createForClass(PromoCodeUsage);
PromoCodeUsageSchema.index({ userId: 1, promoCodeId: 1 });
