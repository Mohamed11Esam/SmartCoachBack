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
        const tier: 'free' | 'pro' | 'elite' = plan.id === 'elite' ? 'elite' : plan.id === 'pro' ? 'pro' : 'free';
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Update user's subscription status and tier in the database
        await this.usersService.updateSubscription(
            userId,
            'active',
            subscriptionId,
            coachId,
            tier,
            periodEnd,
        );

        const user = await this.usersService.findById(userId);

        return {
            success: true,
            subscription: {
                id: subscriptionId,
                planId: plan.id,
                planName: plan.name,
                tier,
                price: plan.price,
                currency: plan.currency,
                interval: plan.interval,
                status: 'active',
                coachId: coachId || null,
                startDate: new Date().toISOString(),
                currentPeriodEnd: periodEnd.toISOString(),
            },
            user: {
                _id: user._id,
                email: user.email,
                subscriptionStatus: 'active',
                subscriptionTier: tier,
            },
        };
    }

    async mockCancelSubscription(userId: string) {
        await this.usersService.updateSubscription(userId, 'canceled', undefined, undefined, 'free');

        return {
            success: true,
            message: 'Subscription canceled successfully',
            status: 'canceled',
            subscriptionTier: 'free',
        };
    }

    async getSubscriptionStatus(userId: string) {
        const user = await this.usersService.findById(userId);
        const tier: 'free' | 'pro' | 'elite' = (user as any)?.subscriptionTier || 'free';
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === (tier === 'free' ? 'basic' : tier)) || SUBSCRIPTION_PLANS[0];

        return {
            subscriptionStatus: user?.subscriptionStatus || 'none',
            subscriptionTier: tier,
            subscriptionPeriodEnd: (user as any)?.subscriptionPeriodEnd || null,
            subscribedCoachId: (user as any)?.subscribedCoachId || null,
            subscriptionId: (user as any)?.subscriptionId || null,
            features: plan?.features || [],
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
        const plan = SUBSCRIPTION_PLANS.find(p => p.priceId === priceId);
        const planId = plan?.id || 'pro';

        if (this.isDev) {
            const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
            return {
                id: `mock_session_${Date.now()}`,
                url: `${baseUrl}/payments/mock-success?planId=${planId}&coachId=${coachId || ''}`,
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
            metadata: { coachId, planId, priceId },
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
        const planId = session.metadata?.planId;

        let user = await this.usersService.findByStripeCustomerId(customerId);
        if (!user && session.customer_details?.email) {
            user = await this.usersService.findByEmail(session.customer_details.email);
        }

        if (user) {
            const tier: 'free' | 'pro' | 'elite' = planId === 'elite' ? 'elite' : planId === 'pro' ? 'pro' : 'free';
            const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await this.usersService.updateSubscription(
                user._id.toString(),
                'active',
                subscriptionId,
                coachId,
                tier,
                periodEnd,
            );
        }
    }

    private async handleSubscriptionDeleted(subscription: any) {
        const user = await this.usersService.findByStripeCustomerId(subscription.customer);
        if (user) {
            await this.usersService.updateSubscription(
                user._id.toString(),
                'canceled',
                subscription.id,
                undefined,
                'free',
            );
        }
    }

    private async handleSubscriptionUpdated(subscription: any) {
        const user = await this.usersService.findByStripeCustomerId(subscription.customer);
        if (user) {
            const status = subscription.status;
            let tier: 'free' | 'pro' | 'elite' = 'free';

            if (status === 'active') {
                const priceId = subscription.items?.data?.[0]?.price?.id;
                const plan = SUBSCRIPTION_PLANS.find(p => p.priceId === priceId);
                tier = plan?.id === 'elite' ? 'elite' : plan?.id === 'pro' ? 'pro' : 'free';
            }

            const periodEnd = subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : undefined;

            await this.usersService.updateSubscription(
                user._id.toString(),
                status,
                subscription.id,
                undefined,
                tier,
                periodEnd,
            );
        }
    }
}
