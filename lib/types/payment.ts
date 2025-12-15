export interface PaymentMethod {
    id: string;
    type: 'card' | 'apple_pay' | 'google_pay';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
    customerId?: string;
}

export interface PaymentIntent {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
    customerId?: string;
}

export interface SetupIntent {
    id: string;
    clientSecret: string;
    status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
    customerId?: string;
}

export interface Subscription {
    id: string;
    customerId: string;
    status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
    stripePriceId: string;
    planName?: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    active: boolean;
    trialEnd?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentResult {
    success: boolean;
    error?: string;
    paymentMethod?: PaymentMethod;
    paymentIntent?: PaymentIntent;
}