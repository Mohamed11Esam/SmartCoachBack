import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    price: number;

    @Prop()
    salePrice?: number;

    @Prop([String])
    images: string[];

    @Prop({ required: true, enum: ['supplements', 'equipment', 'apparel', 'accessories'], index: true })
    category: string;

    @Prop({ default: 0 })
    stock: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: 0 })
    averageRating: number;

    @Prop({ default: 0 })
    reviewCount: number;

    @Prop({ type: [{ userId: Types.ObjectId, rating: Number, review: String, createdAt: Date }] })
    ratings: { userId: Types.ObjectId; rating: number; review: string; createdAt: Date }[];

    @Prop()
    sku?: string;

    @Prop({ type: Object })
    specifications?: Record<string, string>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Add text index for search
ProductSchema.index({ name: 'text', description: 'text' });
