import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true })
    userId: Types.ObjectId;

    @Prop({
        type: [{
            productId: { type: Types.ObjectId, ref: 'Product' },
            quantity: Number,
            price: Number,
            name: String,
            image: String,
        }]
    })
    items: {
        productId: Types.ObjectId;
        quantity: number;
        price: number;
        name: string;
        image: string;
    }[];

    @Prop({ default: 0 })
    totalAmount: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
