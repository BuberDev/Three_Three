import { initStripe } from '@stripe/stripe-react-native';
import { Platform } from 'react-native';

export class StripeSetupError extends Error {
    constructor(message: string) {
        super(`Stripe Setup Error: ${message}`);
        this.name = 'StripeSetupError';
    }
}

export class PaymentServiceManager {
    private static instance: PaymentServiceManager;
    private isInitialized = false;

    static getInstance(): PaymentServiceManager {
        if (!PaymentServiceManager.instance) {
            PaymentServiceManager.instance = new PaymentServiceManager();
        }
        return PaymentServiceManager.instance;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
            throw new StripeSetupError('Missing Stripe publishable key in environment variables');
        }

        try {
            await initStripe({
                publishableKey,
                merchantIdentifier: process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID,
                ...(Platform.OS === 'ios' && {
                    applePay: {
                        merchantIdentifier: process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID || '',
                        merchantCountryCode: 'PL',
                    },
                }),
                ...(Platform.OS === 'android' && {
                    googlePay: {
                        merchantCountryCode: 'PL',
                        currencyCode: 'PLN',
                        testEnv: __DEV__,
                    },
                }),
            });

            this.isInitialized = true;
            console.log('✅ Stripe initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Stripe:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new StripeSetupError(`Failed to initialize Stripe: ${errorMessage}`);
        }
    }

    isReady(): boolean {
        return this.isInitialized;
    }

    async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }
}

// Initialize and export the singleton instance
export const stripeManager = PaymentServiceManager.getInstance();