import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartController, OrdersController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { ProductsModule } from '../products/products.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Cart.name, schema: CartSchema },
            { name: Order.name, schema: OrderSchema },
        ]),
        ProductsModule,
    ],
    controllers: [CartController, OrdersController],
    providers: [CartService],
    exports: [CartService],
})
export class CartModule { }
