export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    priceId: string; // Stripe Price ID
    features: string[];
    recommended?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'basic',
        name: 'Basic Plan',
        price: 29.99,
        currency: 'USD',
        interval: 'month',
        priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_placeholder',
        features: [
            'Access to workout library',
            'Basic nutrition tracking',
            'Email support',
            '1 AI plan per month',
        ],
    },
    {
        id: 'pro',
        name: 'Pro Plan',
        price: 49.99,
        currency: 'USD',
        interval: 'month',
        priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
        features: [
            'Everything in Basic',
            'Unlimited AI plans',
            'Priority support',
            'Progress analytics',
            'Coach messaging',
        ],
        recommended: true,
    },
    {
        id: 'elite',
        name: 'Elite Plan',
        price: 99.99,
        currency: 'USD',
        interval: 'month',
        priceId: process.env.STRIPE_ELITE_PRICE_ID || 'price_elite_placeholder',
        features: [
            'Everything in Pro',
            'Personal coach access',
            '1-on-1 video calls',
            'Custom meal plans',
            'Custom workout routines',
            'VIP support',
        ],
    },
];

export function getSubscriptionPlanByPriceId(priceId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.priceId === priceId);
}

export function getSubscriptionPlanById(id: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === id);
}
