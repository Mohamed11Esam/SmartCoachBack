import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
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

    @Prop({ required: true })
    totalAmount: number;

    @Prop({
        required: true,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
        index: true,
    })
    status: string;

    @Prop({ type: Object })
    shippingAddress: {
        name: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        phone: string;
    };

    @Prop()
    stripePaymentIntentId?: string;

    @Prop()
    stripeSessionId?: string;

    @Prop()
    trackingNumber?: string;

    @Prop()
    notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
