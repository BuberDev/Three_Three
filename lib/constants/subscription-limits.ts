/**
 * Subscription Limits Configuration
 * Defines what free users can and cannot do
 */

export const FREE_USER_LIMITS = {
    // Voice Notes
    voiceNotesPerMonth: 10,
    maxVoiceNoteDuration: 120, // 2 minutes in seconds
    voiceNoteTranscription: false, // No AI transcription

    // Sleep Tracking  
    sleepSessionsPerMonth: 7,
    sleepAnalysisBasic: true, // Basic analysis only
    sleepAnalysisAI: false, // No AI insights
    sleepHistoryDays: 30, // Last 30 days only

    // Tasks & Activities
    tasksPerDay: 5,
    activitiesPerDay: 10,
    taskCategories: 3, // Limited categories

    // AI Features
    aiInsights: false,
    aiRecommendations: false,
    chatWithAI: false,
    correlationAnalysis: false,

    // Data & Export
    dataRetentionDays: 90, // 3 months
    exportsPerMonth: 1,
    exportFormats: ['PDF'], // Only PDF, no CSV/JSON

    // Analytics & Reports
    analyticsHistoryMonths: 1, // Last month only
    customReports: false,
    advancedCharts: false,

    // General
    prioritySupport: false,
    betaFeatures: false,
    multiDeviceSync: false,
    cloudBackup: false
} as const;

export const PREMIUM_USER_FEATURES = {
    // Voice Notes
    voiceNotesPerMonth: -1, // Unlimited
    maxVoiceNoteDuration: -1, // Unlimited  
    voiceNoteTranscription: true,
    voiceNoteSearch: true,
    voiceNoteTags: true,

    // Sleep Tracking
    sleepSessionsPerMonth: -1, // Unlimited
    sleepAnalysisAI: true,
    sleepHistoryDays: -1, // All history
    sleepInsights: true,
    sleepRecommendations: true,

    // AI Features
    aiInsights: true,
    aiRecommendations: true,
    chatWithAI: true,
    correlationAnalysis: true,
    behavioralPatterns: true,

    // Data & Export
    dataRetentionDays: -1, // Forever
    exportsPerMonth: -1, // Unlimited
    exportFormats: ['PDF', 'CSV', 'JSON', 'XML'],

    // Analytics & Reports  
    analyticsHistoryMonths: -1, // All history
    customReports: true,
    advancedCharts: true,

    // General
    prioritySupport: true,
    betaFeatures: true,
    multiDeviceSync: true,
    cloudBackup: true
} as const;

export type LimitType = keyof typeof FREE_USER_LIMITS;

/**
 * Check if user has reached a specific limit
 */
export function hasReachedLimit(
    limitType: LimitType,
    currentUsage: number,
    isPremium: boolean = false
): boolean {
    if (isPremium) {
        const premiumLimit = PREMIUM_USER_FEATURES[limitType as keyof typeof PREMIUM_USER_FEATURES];
        return premiumLimit === -1 ? false : currentUsage >= (premiumLimit as number);
    }

    const freeLimit = FREE_USER_LIMITS[limitType];
    return typeof freeLimit === 'number' && freeLimit !== -1 && currentUsage >= freeLimit;
}

/**
 * Get remaining usage for a specific limit
 */
export function getRemainingUsage(
    limitType: LimitType,
    currentUsage: number,
    isPremium: boolean = false
): number | null {
    if (isPremium) {
        const premiumLimit = PREMIUM_USER_FEATURES[limitType as keyof typeof PREMIUM_USER_FEATURES];
        return premiumLimit === -1 ? null : Math.max(0, (premiumLimit as number) - currentUsage);
    }

    const freeLimit = FREE_USER_LIMITS[limitType];
    return typeof freeLimit === 'number' && freeLimit !== -1
        ? Math.max(0, freeLimit - currentUsage)
        : null;
}

/**
 * Get user-friendly limit description
 */
export function getLimitDescription(limitType: LimitType, isPremium: boolean = false): string {
    const limit = isPremium
        ? PREMIUM_USER_FEATURES[limitType as keyof typeof PREMIUM_USER_FEATURES]
        : FREE_USER_LIMITS[limitType];

    if (typeof limit === 'boolean') {
        return limit ? 'Dostępne' : 'Niedostępne';
    }

    if (typeof limit === 'number') {
        return limit === -1 ? 'Bez limitu' : limit.toString();
    }

    return 'Nieznane';
}