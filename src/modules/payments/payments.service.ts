import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SUBSCRIPTION_PLANS, getSubscriptionPlanById } from '../../config/subscription-plans.config';

@Injectable()
export class PaymentsService {
    private isDev: boolean;

    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        this.isDev = this.configService.get('NODE_ENV') !== 'production';
    }

    // ── Mock Subscription Flow (for dev/demo) ──

    async mockCreateCheckoutSession(userId: string, planId: string, coachId?: string) {
        const plan = getSubscriptionPlanById(planId);
        if (!plan) {
            throw new Error('Invalid plan');
        }

        // Generate a fake session ID
        const sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';

        return {
            sessionId,
            url: `${baseUrl}/payments/mock-success?sessionId=${sessionId}&userId=${userId}&planId=${planId}&coachId=${coachId || ''}`,
            plan: {
                id: plan.id,
                name: plan.name,
                price: plan.price,
                currency: plan.currency,
                interval: plan.interval,
            },
        };
    }

    async mockConfirmSubscription(userId: string, planId: string, coachId?: string) {
        const plan = getSubscriptionPlanById(planId);
        if (!plan) {
            throw new Error('Invalid plan');
        }

        const subscriptionId = `mock_sub_${Date.now()}`;

        // Update user's subscription status in the database
        await this.usersService.updateSubscription(
            userId,
            'active',
            subscriptionId,
            coachId,
        );

        const user = await this.usersService.findById(userId);

        return {
            success: true,
            subscription: {
                id: subscriptionId,
                planId: plan.id,
                planName: plan.name,
                price: plan.price,
                currency: plan.currency,
                interval: plan.interval,
                status: 'active',
                coachId: coachId || null,
                startDate: new Date().toISOString(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            user: {
                _id: user._id,
                email: user.email,
                subscriptionStatus: 'active',
            },
        };
    }

    async mockCancelSubscription(userId: string) {
        await this.usersService.updateSubscription(userId, 'canceled');

        return {
            success: true,
            message: 'Subscription canceled successfully',
            status: 'canceled',
        };
    }

    async getSubscriptionStatus(userId: string) {
        const user = await this.usersService.findById(userId);

        return {
            subscriptionStatus: user.subscriptionStatus || 'none',
            subscribedCoachId: (user as any).subscribedCoachId || null,
            subscriptionId: (user as any).subscriptionId || null,
        };
    }

    // ── Real Stripe (only used in production) ──

    async createCustomer(email: string, name: string) {
        if (this.isDev) {
            return { id: `mock_cus_${Date.now()}` };
        }
        const Stripe = require('stripe');
        const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
        return stripe.customers.create({ email, name });
    }

    async createCheckoutSession(customerId: string, priceId: string, coachId: string) {
        if (this.isDev) {
            const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
            return {
                id: `mock_session_${Date.now()}`,
                url: `${baseUrl}/payments/mock-success`,
            };
        }
        const Stripe = require('stripe');
        const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
        return stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: this.configService.get('STRIPE_SUCCESS_URL'),
            cancel_url: this.configService.get('STRIPE_CANCEL_URL'),
            metadata: { coachId },
        });
    }

    constructEventFromPayload(signature: string, payload: Buffer) {
        const Stripe = require('stripe');
        const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            this.configService.get('STRIPE_WEBHOOK_SECRET'),
        );
    }

    async handleWebhook(event: any) {
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
        } catch (error: any) {
            console.error('Webhook Error:', error.message);
        }
    }

    private async handleCheckoutSessionCompleted(session: any) {
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const coachId = session.metadata?.coachId;

        let user = await this.usersService.findByStripeCustomerId(customerId);
        if (!user && session.customer_details?.email) {
            user = await this.usersService.findByEmail(session.customer_details.email);
        }

        if (user) {
            await this.usersService.updateSubscription(user._id.toString(), 'active', subscriptionId, coachId);
        }
    }

    private async handleSubscriptionDeleted(subscription: any) {
        const user = await this.usersService.findByStripeCustomerId(subscription.customer);
        if (user) {
            await this.usersService.updateSubscription(user._id.toString(), 'canceled', subscription.id);
        }
    }

    private async handleSubscriptionUpdated(subscription: any) {
        const user = await this.usersService.findByStripeCustomerId(subscription.customer);
        if (user) {
            await this.usersService.updateSubscription(user._id.toString(), subscription.status, subscription.id);
        }
    }
}
