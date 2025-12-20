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

        // Enhanced validation with better error handling
        const stripeConfig = this.validateStripeConfiguration(publishableKey);

        if (!stripeConfig.isValid) {
            if (__DEV__) {
                console.warn(`⚠️ Stripe Configuration Issue: ${stripeConfig.reason} - Payment features will be disabled`);
                this.isInitialized = false;
                return;
            }
            throw new StripeSetupError(stripeConfig.reason);
        }

        try {
            await initStripe({
                publishableKey: stripeConfig.key!,
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

            // In development, log warning but don't throw
            if (__DEV__) {
                console.warn('⚠️ Stripe initialization failed in development - payment features will be disabled');
                return;
            }

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

    /**
     * Validates Stripe configuration with comprehensive checks
     * Implements enterprise-grade validation patterns
     */
    private validateStripeConfiguration(publishableKey?: string): {
        isValid: boolean;
        key?: string;
        reason: string;
    } {
        // Check if key exists
        if (!publishableKey || publishableKey.trim() === '') {
            return {
                isValid: false,
                reason: 'Missing Stripe publishable key in environment variables'
            };
        }

        const trimmedKey = publishableKey.trim();

        // Check for common placeholder patterns
        const placeholderPatterns = [
            'placeholder',
            'your_key_here',
            'pk_test_example',
            'pk_live_example',
            'replace_me'
        ];

        const isPlaceholder = placeholderPatterns.some(pattern =>
            trimmedKey.toLowerCase().includes(pattern.toLowerCase())
        );

        if (isPlaceholder) {
            return {
                isValid: false,
                reason: 'Invalid Stripe publishable key - appears to be a placeholder'
            };
        }

        // Validate Stripe key format
        const stripeKeyPattern = /^pk_(test|live)_[a-zA-Z0-9]{24,}$/;
        if (!stripeKeyPattern.test(trimmedKey)) {
            return {
                isValid: false,
                reason: 'Invalid Stripe publishable key format'
            };
        }

        // Check minimum length (Stripe keys should be at least 50 characters)
        if (trimmedKey.length < 50) {
            return {
                isValid: false,
                reason: 'Invalid Stripe publishable key - too short'
            };
        }

        return {
            isValid: true,
            key: trimmedKey,
            reason: 'Valid Stripe configuration'
        };
    }

    /**
     * Checks if payment features are available
     * Used throughout the app to conditionally show payment UI
     */
    public isPaymentAvailable(): boolean {
        return this.isInitialized;
    }
}

// Initialize and export the singleton instance
export const stripeManager = PaymentServiceManager.getInstance();