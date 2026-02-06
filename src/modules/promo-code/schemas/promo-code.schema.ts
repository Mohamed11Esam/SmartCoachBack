import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromoCodeDocument = PromoCode & Document;

@Schema({ timestamps: true })
export class PromoCode {
    @Prop({ required: true, unique: true, uppercase: true })
    code: string;

    @Prop({ required: true, enum: ['percentage', 'fixed'] })
    discountType: string;

    @Prop({ required: true })
    discountValue: number; // percentage (0-100) or fixed amount

    @Prop()
    description?: string;

    @Prop()
    minOrderAmount?: number;

    @Prop()
    maxDiscountAmount?: number; // cap for percentage discounts

    @Prop({ default: null })
    maxUses?: number; // null = unlimited

    @Prop({ default: 0 })
    currentUses: number;

    @Prop({ default: 1 })
    maxUsesPerUser: number;

    @Prop()
    validFrom?: Date;

    @Prop()
    validUntil?: Date;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: [String], default: [] })
    applicableCategories: string[]; // empty = all categories
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);
PromoCodeSchema.index({ code: 1 });
PromoCodeSchema.index({ isActive: 1, validUntil: 1 });
