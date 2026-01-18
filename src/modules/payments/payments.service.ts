import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
    private stripe: Stripe;

    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        this.stripe = new Stripe(this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'), {
            apiVersion: '2025-11-17.clover' as any, // Explicitly cast if needed, but the string matches the error message requirement
        });
    }

    async createCustomer(email: string, name: string) {
        return this.stripe.customers.create({ email, name });
    }

    async createCheckoutSession(customerId: string, priceId: string, coachId: string) {
        return this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: this.configService.get('STRIPE_SUCCESS_URL') || 'http://localhost:3000/success',
            cancel_url: this.configService.get('STRIPE_CANCEL_URL') || 'http://localhost:3000/cancel',
            metadata: { coachId },
        });
    }

    constructEventFromPayload(signature: string, payload: Buffer) {
        return this.stripe.webhooks.constructEvent(
            payload,
            signature,
            this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
        );
    }

    async handleWebhook(event: Stripe.Event) {
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object as Stripe.Checkout.Session;
                    await this.handleCheckoutSessionCompleted(session);
                    break;
                case 'customer.subscription.deleted':
                    const subscription = event.data.object as Stripe.Subscription;
                    await this.handleSubscriptionDeleted(subscription);
                    break;
                case 'customer.subscription.updated':
                    const updatedSub = event.data.object as Stripe.Subscription;
                    await this.handleSubscriptionUpdated(updatedSub);
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
        } catch (error) {
            console.error('Webhook Error:', error.message);
            // Don't throw to avoid retries for non-critical errors
        }
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const coachId = session.metadata?.coachId;

        console.log(`💰 Payment successful for customer ${customerId}, coach ${coachId}`);

        // Find user by Stripe Customer ID
        let user = await this.usersService.findByStripeCustomerId(customerId);

        // If not found by ID (maybe first time?), try email
        if (!user && session.customer_details?.email) {
            user = await this.usersService.findByEmail(session.customer_details.email);
            // TODO: Link customer ID to user if found?
        }

        if (user) {
            await this.usersService.updateSubscription(
                user._id.toString(),
                'active',
                subscriptionId,
                coachId
            );
        } else {
            console.warn(`⚠️ User not found for checkout session: ${session.id}`);
        }
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;
        const user = await this.usersService.findByStripeCustomerId(customerId);

        if (user) {
            await this.usersService.updateSubscription(
                user._id.toString(),
                'canceled',
                subscription.id,
                undefined // Remove coach access
            );
            console.log(`❌ Subscription canceled for user ${user._id}`);
        }
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;
        const user = await this.usersService.findByStripeCustomerId(customerId);

        if (user) {
            await this.usersService.updateSubscription(
                user._id.toString(),
                subscription.status, // e.g., 'past_due', 'active'
                subscription.id
            );
            console.log(`🔄 Subscription updated for user ${user._id}: ${subscription.status}`);
        }
    }
}
