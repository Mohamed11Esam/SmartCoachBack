import { Controller, Post, Body, Headers, Req, BadRequestException, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { SUBSCRIPTION_PLANS } from '../../config/subscription-plans.config';
import type { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get('plans')
    @ApiOperation({ summary: 'Get available subscription plans' })
    @ApiResponse({ status: 200, description: 'Subscription plans returned' })
    async getPlans() {
        return SUBSCRIPTION_PLANS;
    }

    @Post('create-checkout-session')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create Stripe checkout session for subscription' })
    @ApiResponse({ status: 200, description: 'Checkout session created' })
    async createCheckoutSession(@Body() body: { coachId: string, priceId: string }, @Req() req) {
        const user = req.user;
        // In a real implementation, we would ensure user has a stripe customer ID or create one
        const customerId = user.stripeCustomerId || await this.paymentsService.createCustomer(user.email, `${user.firstName} ${user.lastName}`).then(c => c.id);

        const session = await this.paymentsService.createCheckoutSession(customerId, body.priceId, body.coachId);
        return { sessionId: session.id, url: session.url };
    }

    @Post('webhook')
    @Public()
    @ApiOperation({ summary: 'Stripe webhook handler' })
    async handleWebhook(@Headers('stripe-signature') signature: string, @Req() request: Request) {
        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }

        const rawBody = (request as any).rawBody;

        try {
            const event = this.paymentsService.constructEventFromPayload(signature, rawBody);
            await this.paymentsService.handleWebhook(event);
            return { received: true };
        } catch (err: any) {
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }
    }
}

