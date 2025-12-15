export enum SubscriptionStatus {
    TRIAL = 'trial',
    ACTIVE = 'active',
    CANCELED = 'canceled',
    EXPIRED = 'expired',
    SUSPENDED = 'suspended'
}

export enum SubscriptionPlan {
    FREE_TRIAL = 'free_trial',
    MONTHLY_PRO = 'monthly_pro',
    ANNUAL_PRO = 'annual_pro'
}

export enum SubscriptionFeature {
    // Core features
    BASIC_VOICE_NOTES = 'basic_voice_notes',
    BASIC_SLEEP_TRACKING = 'basic_sleep_tracking',
    BASIC_TASKS = 'basic_tasks',

    // Premium features
    UNLIMITED_VOICE_NOTES = 'unlimited_voice_notes',
    ADVANCED_SLEEP_ANALYSIS = 'advanced_sleep_analysis',
    AI_INSIGHTS = 'ai_insights',
    CORRELATION_ANALYSIS = 'correlation_analysis',
    BEHAVIORAL_PATTERNS = 'behavioral_patterns',
    ADVANCED_ANALYTICS = 'advanced_analytics',
    DATA_EXPORT = 'data_export',
    PRIORITY_SUPPORT = 'priority_support',
    EXTENDED_HISTORY = 'extended_history',
    CUSTOM_REPORTS = 'custom_reports'
}