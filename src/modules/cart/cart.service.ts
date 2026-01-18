import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Order, OrderDocument } from './schemas/order.schema';
import { ProductsService } from '../products/products.service';
import { AddToCartDto, UpdateCartItemDto, CheckoutDto } from './dto/cart.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private productsService: ProductsService,
    ) { }

    async getCart(userId: string): Promise<Cart> {
        let cart = await this.cartModel.findOne({ userId }).exec();
        if (!cart) {
            cart = await this.cartModel.create({ userId, items: [], totalAmount: 0 });
        }
        return cart;
    }

    async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
        const product = await this.productsService.findOne(addToCartDto.productId);
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (product.stock < addToCartDto.quantity) {
            throw new BadRequestException('Insufficient stock');
        }

        let cart = await this.cartModel.findOne({ userId }).exec();
        if (!cart) {
            cart = new this.cartModel({ userId, items: [], totalAmount: 0 });
        }

        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === addToCartDto.productId
        );

        const effectivePrice = product.salePrice || product.price;

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += addToCartDto.quantity;
            cart.items[existingItemIndex].price = effectivePrice;
        } else {
            cart.items.push({
                productId: addToCartDto.productId as any,
                quantity: addToCartDto.quantity,
                price: effectivePrice,
                name: product.name,
                image: product.images?.[0] || '',
            });
        }

        cart.totalAmount = cart.items.reduce(
            (total, item) => total + (item.price * item.quantity),
            0
        );

        return cart.save();
    }

    async updateCartItem(userId: string, productId: string, updateDto: UpdateCartItemDto): Promise<Cart> {
        const cart = await this.cartModel.findOne({ userId }).exec();
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (itemIndex === -1) {
            throw new NotFoundException('Item not found in cart');
        }

        if (updateDto.quantity === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            const product = await this.productsService.findOne(productId);
            if (product.stock < updateDto.quantity) {
                throw new BadRequestException('Insufficient stock');
            }
            cart.items[itemIndex].quantity = updateDto.quantity;
        }

        cart.totalAmount = cart.items.reduce(
            (total, item) => total + (item.price * item.quantity),
            0
        );

        return cart.save();
    }

    async removeFromCart(userId: string, productId: string): Promise<Cart> {
        const cart = await this.cartModel.findOne({ userId }).exec();
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
        );

        cart.totalAmount = cart.items.reduce(
            (total, item) => total + (item.price * item.quantity),
            0
        );

        return cart.save();
    }

    async clearCart(userId: string): Promise<Cart> {
        const cart = await this.cartModel.findOne({ userId }).exec();
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        cart.items = [];
        cart.totalAmount = 0;

        return cart.save();
    }

    async checkout(userId: string, checkoutDto: CheckoutDto): Promise<Order> {
        const cart = await this.cartModel.findOne({ userId }).exec();
        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // Verify stock for all items
        for (const item of cart.items) {
            const product = await this.productsService.findOne(item.productId.toString());
            if (product.stock < item.quantity) {
                throw new BadRequestException(`Insufficient stock for ${product.name}`);
            }
        }

        // Create order
        const order = await this.orderModel.create({
            userId,
            items: cart.items,
            totalAmount: cart.totalAmount,
            status: 'pending',
            shippingAddress: checkoutDto.shippingAddress,
            notes: checkoutDto.notes,
        });

        // Update stock for each product
        for (const item of cart.items) {
            await this.productsService.updateStock(item.productId.toString(), -item.quantity);
        }

        // Clear cart
        await this.clearCart(userId);

        return order;
    }

    async getOrders(userId: string): Promise<Order[]> {
        return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
    }

    async getOrder(userId: string, orderId: string): Promise<Order> {
        const order = await this.orderModel.findOne({ _id: orderId, userId }).exec();
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    async updateOrderStatus(orderId: string, status: string): Promise<Order> {
        const order = await this.orderModel.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).exec();
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    async getAllOrders(query: any = {}): Promise<Order[]> {
        const filter: any = {};
        if (query.status) filter.status = query.status;

        return this.orderModel.find(filter).sort({ createdAt: -1 }).exec();
    }
}
