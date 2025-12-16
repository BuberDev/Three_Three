export interface SubscriptionPlan {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    stripePriceId?: string;
    recommended?: boolean;
    features: SubscriptionFeature[];
    limits?: {
        voiceNotes?: number;
        sleepSessions?: number;
        dataRetentionDays?: number;
        analyticsHistory?: number;
        exportsPerMonth?: number;
    };
    isActive?: boolean;
    metadata?: {
        highlightFeature?: string;
        popularBadge?: boolean;
        trialIncluded?: boolean;
    };
}

export interface SubscriptionStatus {
    hasActiveSubscription: boolean;
    isOnTrial: boolean;
    isPremiumUser: boolean;
    plan: string | null;
    status: 'trial' | 'active' | 'canceled' | 'expired' | null;
    trialEndDate?: Date;
    currentPeriodEnd?: Date;
    daysRemaining: number;
    usage: {
        voiceNotesUsed: number;
        sleepSessionsUsed: number;
        exportsThisMonth: number;
    };
}

export type SubscriptionFeature =
    | 'unlimited_voice_notes'
    | 'advanced_sleep_analysis'
    | 'ai_insights'
    | 'correlation_analysis'
    | 'behavioral_patterns'
    | 'advanced_analytics'
    | 'data_export'
    | 'priority_support'
    | 'extended_history'
    | 'custom_reports'
    | string; // Allow any string for enterprise features