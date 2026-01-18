import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CheckoutDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    @ApiOperation({ summary: 'Get current user cart' })
    @ApiResponse({ status: 200, description: 'Cart returned' })
    async getCart(@Request() req) {
        return this.cartService.getCart(req.user.userId);
    }

    @Post('add')
    @ApiOperation({ summary: 'Add item to cart' })
    @ApiResponse({ status: 200, description: 'Item added to cart' })
    async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
        return this.cartService.addToCart(req.user.userId, addToCartDto);
    }

    @Put('item/:productId')
    @ApiOperation({ summary: 'Update cart item quantity' })
    @ApiResponse({ status: 200, description: 'Cart item updated' })
    async updateCartItem(
        @Request() req,
        @Param('productId') productId: string,
        @Body() updateDto: UpdateCartItemDto,
    ) {
        return this.cartService.updateCartItem(req.user.userId, productId, updateDto);
    }

    @Delete('item/:productId')
    @ApiOperation({ summary: 'Remove item from cart' })
    @ApiResponse({ status: 200, description: 'Item removed from cart' })
    async removeFromCart(@Request() req, @Param('productId') productId: string) {
        return this.cartService.removeFromCart(req.user.userId, productId);
    }

    @Delete('clear')
    @ApiOperation({ summary: 'Clear entire cart' })
    @ApiResponse({ status: 200, description: 'Cart cleared' })
    async clearCart(@Request() req) {
        return this.cartService.clearCart(req.user.userId);
    }

    @Post('checkout')
    @ApiOperation({ summary: 'Checkout and create order' })
    @ApiResponse({ status: 201, description: 'Order created' })
    async checkout(@Request() req, @Body() checkoutDto: CheckoutDto) {
        return this.cartService.checkout(req.user.userId, checkoutDto);
    }
}

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    @ApiOperation({ summary: 'Get user orders' })
    @ApiResponse({ status: 200, description: 'Orders returned' })
    async getOrders(@Request() req) {
        return this.cartService.getOrders(req.user.userId);
    }

    @Get('all')
    @UseGuards(RolesGuard)
    @Roles('Admin')
    @ApiOperation({ summary: 'Get all orders (Admin only)' })
    @ApiResponse({ status: 200, description: 'All orders returned' })
    async getAllOrders(@Query() query: any) {
        return this.cartService.getAllOrders(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order details' })
    @ApiResponse({ status: 200, description: 'Order returned' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async getOrder(@Request() req, @Param('id') id: string) {
        return this.cartService.getOrder(req.user.userId, id);
    }

    @Put(':id/status')
    @UseGuards(RolesGuard)
    @Roles('Admin')
    @ApiOperation({ summary: 'Update order status (Admin only)' })
    @ApiResponse({ status: 200, description: 'Order status updated' })
    async updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }) {
        return this.cartService.updateOrderStatus(id, body.status);
    }
}
