import { registerAs } from '@nestjs/config';

export const stripeConfig = registerAs('stripe', () => ({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    apiVersion: '2022-11-15' as const,
    currency: 'pln',
    country: 'PL',
    pricing: {
        premium: {
            monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
            yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
        },
    },
}));

export const applePayConfig = registerAs('apple', () => ({
    // Apple Pay configuration
    merchantIdentifier: process.env.APPLE_MERCHANT_ID,
    countryCode: 'PL',
    currencyCode: 'PLN',
    supportedNetworks: ['visa', 'masterCard', 'amex'],
    merchantCapabilities: ['supports3DS', 'supportsDebit', 'supportsCredit'],
    // Development certificate paths
    certificatePath: process.env.APPLE_PAY_CERT_PATH,
    keyPath: process.env.APPLE_PAY_KEY_PATH,
    bundleId: process.env.APPLE_BUNDLE_ID,
}));

export const googlePayConfig = registerAs('google', () => ({
    // Google Pay configuration
    merchantId: process.env.GOOGLE_MERCHANT_ID,
    environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST',
    countryCode: 'PL',
    currencyCode: 'PLN',
    allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX'],
    allowedCardAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
}));