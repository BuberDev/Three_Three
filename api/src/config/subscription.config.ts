export default () => ({
    subscription: {
        enableScheduling: process.env.SUBSCRIPTION_SCHEDULING_ENABLED === 'true' || true,
        trialDurationDays: parseInt(process.env.TRIAL_DURATION_DAYS || '7', 10),
        notificationDaysBeforeExpiry: [1, 2], // Send notifications 1-2 days before expiry
        maxRetries: 3,
        batchSize: 100, // Process subscriptions in batches
    },
});