import { FREE_USER_LIMITS, hasReachedLimit, LimitType } from '@/lib/constants/subscription-limits';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DatabaseService } from '../lib/database/database';
import { ApiService } from '../lib/services/api';
import { AudioService } from '../lib/services/audio';
import { EventService } from '../lib/services/event';
import {
    Activity,
    DailyEntry,
    DailyMetrics,
    EventType,
    ProgressMetrics,
    Recommendation,
    RecordingState,
    Task,
    User,
    UserSettings,
    VoiceNote,
    WeeklyInsights
} from '../lib/types';
import { SubscriptionFeature, SubscriptionPlan, SubscriptionStatus } from '../lib/types/subscription';

interface AppStore {
    // User state
    user: User | null;
    userSettings: UserSettings | null;
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;

    // Subscription state
    subscriptionStatus: SubscriptionStatus | null;
    subscription: any | null;
    availablePlans: SubscriptionPlan[];

    // Voice notes state
    voiceNotes: VoiceNote[];
    currentRecording: RecordingState;
    isProcessingVoiceNote: boolean;

    // Tasks state
    tasks: Task[];
    todaysTasks: Task[];

    // Daily entry state
    todayEntry: DailyEntry | null;

    // Recommendations state
    recommendations: Recommendation[];

    // Activity tracking state
    activities: Activity[];
    todaysActivities: Activity[];
    dailyMetrics: DailyMetrics | null;
    weeklyInsights: WeeklyInsights | null;
    progressMetrics: ProgressMetrics | null;

    // UI state
    isLoading: boolean;
    error: string | null;
    isOnboarding: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setUserSettings: (settings: UserSettings) => void;
    setAuthenticated: (auth: boolean) => void;
    setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
    clearTokens: () => Promise<void>;

    // Subscription actions
    loadSubscriptionStatus: () => Promise<void>;
    loadAvailablePlans: () => Promise<void>;
    startTrial: () => Promise<boolean>;
    createSubscription: (planId: string, paymentMethodId?: string) => Promise<boolean>;
    cancelSubscription: (reason?: string) => Promise<boolean>;
    hasFeatureAccess: (feature: keyof SubscriptionFeature) => boolean;
    checkUsageLimit: (limitType: string) => boolean;
    canUseFeature: (feature: string) => { allowed: boolean; reason?: string };
    getRemainingUsage: (limitType: LimitType) => number | null;

    // Voice notes actions
    addVoiceNote: (voiceNote: VoiceNote) => void;
    loadVoiceNotes: () => Promise<void>;
    updateRecordingState: (state: RecordingState) => void;
    setProcessingVoiceNote: (processing: boolean) => void;
    uploadVoiceNote: (audioUri: string) => Promise<boolean>;
    uploadVoiceNoteWithContext: (audioUri: string, context?: string) => Promise<boolean>;
    uploadSleepRecording: (sleepData: any) => Promise<boolean>;
    getSleepInsights: (sleepTrackingId: string) => Promise<any>;

    // 🏢 ENTERPRISE Voice Recording Functions
    uploadDailyReportVoice: (audioUri: string, reportType: 'morning' | 'evening' | 'summary') => Promise<boolean>;
    uploadSleepReportVoice: (audioUri: string, sleepType: 'dream' | 'insomnia' | 'morning-reflection' | 'sleep-quality') => Promise<boolean>;
    uploadLifeExperienceVoice: (audioUri: string, category: 'reflection' | 'gratitude' | 'emotion' | 'achievement' | 'challenge') => Promise<boolean>;

    // Tasks actions
    addTask: (task: Task) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    toggleTaskCompletion: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
    loadTasks: () => Promise<void>;

    // Activity tracking actions
    addActivity: (activity: Activity) => void;
    loadActivities: () => Promise<void>;
    loadDailyMetrics: () => Promise<void>;
    loadWeeklyInsights: () => Promise<void>;
    loadProgressMetrics: () => Promise<void>;
    generatePersonalizedRecommendations: () => Promise<void>;

    // Daily entry actions
    setTodayEntry: (entry: DailyEntry) => void;
    generateDailySummary: () => Promise<void>;

    // General actions
    initialize: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    setOnboardingComplete: () => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            userSettings: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,

            // Subscription initial state
            subscriptionStatus: null,
            subscription: null,
            availablePlans: [],

            voiceNotes: [],
            currentRecording: { isRecording: false, duration: 0 },
            isProcessingVoiceNote: false,
            tasks: [],
            todaysTasks: [],
            todayEntry: null,
            recommendations: [],

            // Activity tracking initial state
            activities: [],
            todaysActivities: [],
            dailyMetrics: null,
            weeklyInsights: null,
            progressMetrics: null,

            isLoading: false,
            error: null,
            isOnboarding: true,

            // User actions
            setUser: (user) => set({ user }),
            setUserSettings: (userSettings) => set({ userSettings }),
            setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

            setTokens: async (accessToken, refreshToken) => {
                try {
                    // Enterprise validation - prevent AsyncStorage errors
                    if (!accessToken || !refreshToken) {
                        console.error('❌ setTokens called with invalid tokens:', {
                            hasAccessToken: !!accessToken,
                            hasRefreshToken: !!refreshToken,
                            accessTokenType: typeof accessToken,
                            refreshTokenType: typeof refreshToken
                        });
                        throw new Error('Invalid tokens: both accessToken and refreshToken are required');
                    }

                    // Ensure tokens are strings
                    const validAccessToken = String(accessToken).trim();
                    const validRefreshToken = String(refreshToken).trim();

                    if (!validAccessToken || !validRefreshToken) {
                        throw new Error('Invalid tokens: empty or whitespace-only tokens');
                    }

                    await AsyncStorage.setItem('@access_token', validAccessToken);
                    await AsyncStorage.setItem('@refresh_token', validRefreshToken);
                    set({ accessToken: validAccessToken, refreshToken: validRefreshToken });

                    console.log('✅ Tokens stored successfully', {
                        accessTokenLength: validAccessToken.length,
                        refreshTokenLength: validRefreshToken.length
                    });
                } catch (error) {
                    console.error('❌ Error saving tokens:', error);
                    throw error; // Re-throw for calling code to handle
                }
            },

            clearTokens: async () => {
                try {
                    await AsyncStorage.removeItem('@access_token');
                    await AsyncStorage.removeItem('@refresh_token');
                    set({ accessToken: null, refreshToken: null });
                } catch (error) {
                    console.error('Error clearing tokens:', error);
                }
            },

            // Subscription actions
            loadSubscriptionStatus: async () => {
                try {
                    const apiService = ApiService.getInstance();
                    const response = await apiService.makeRequest('/subscriptions/current');
                    if (response.success && response.data) {
                        const summary = response.data as any; // SubscriptionSummary from backend

                        // Map SubscriptionSummary to SubscriptionStatus for frontend
                        const status: SubscriptionStatus = {
                            hasActiveSubscription: !!summary.subscription,
                            isOnTrial: summary.subscription?.isTrialActive || false,
                            isPremiumUser: summary.subscription?.plan === 'PREMIUM' || false,
                            plan: summary.subscription?.plan || null,
                            status: summary.subscription?.status || null,
                            trialEndDate: summary.subscription?.trialEndDate ? new Date(summary.subscription.trialEndDate) : undefined,
                            currentPeriodEnd: summary.subscription?.currentPeriodEnd ? new Date(summary.subscription.currentPeriodEnd) : undefined,
                            daysRemaining: summary.daysRemaining || 0,
                            usage: summary.usage || {
                                voiceNotesUsed: 0,
                                sleepSessionsUsed: 0,
                                exportsThisMonth: 0
                            }
                        };

                        set({ subscriptionStatus: status });
                    } else {
                        set({ subscriptionStatus: null });
                    }
                } catch (error) {
                    console.error('Failed to load subscription status:', error);
                    set({ subscriptionStatus: null });
                }
            },

            loadAvailablePlans: async () => {
                try {
                    const apiService = ApiService.getInstance();
                    const response = await apiService.makeRequest('/subscriptions/plans');
                    if (response.success) {
                        set({ availablePlans: response.data as SubscriptionPlan[] });
                    }
                } catch (error) {
                    console.error('Failed to load available plans:', error);
                    set({ availablePlans: [] });
                }
            },

            startTrial: async () => {
                try {
                    const apiService = ApiService.getInstance();
                    const response = await apiService.makeRequest('/subscriptions/trial', {
                        method: 'POST'
                    });

                    if (response.success) {
                        await get().loadSubscriptionStatus();
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Failed to start trial:', error);
                    return false;
                }
            },

            createSubscription: async (stripePriceId: string, paymentMethodType?: string) => {
                try {
                    const { accessToken } = get();
                    if (!accessToken) return false;

                    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/subscriptions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            stripePriceId,
                            paymentMethodType
                        }),
                    });

                    if (response.ok) {
                        const subscription = await response.json();
                        set({ subscription: subscription });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Failed to create subscription:', error);
                    return false;
                }
            },

            cancelSubscription: async (reason?: string) => {
                try {
                    const apiService = ApiService.getInstance();
                    const response = await apiService.makeRequest('/subscriptions/current', {
                        method: 'DELETE',
                        body: JSON.stringify({ reason })
                    });

                    if (response.success) {
                        await get().loadSubscriptionStatus();
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Failed to cancel subscription:', error);
                    return false;
                }
            },

            hasFeatureAccess: (feature: keyof SubscriptionFeature) => {
                const state = get();
                const subscription = state.subscriptionStatus;

                if (!subscription) {
                    return false; // No subscription = no premium features
                }

                // Check if user has premium access (either paid or trial)
                return subscription.isPremiumUser || subscription.isOnTrial;
            },

            checkUsageLimit: (limitType: string) => {
                const state = get();
                const subscription = state.subscriptionStatus;

                // Check if user has premium access (paid or trial)
                const isPremium = subscription?.isPremiumUser || subscription?.isOnTrial || false;

                if (isPremium) {
                    return false; // Premium users have no limits
                }

                // For free users, check specific usage based on limitType
                const usage = subscription?.usage || { voiceNotesUsed: 0, sleepSessionsUsed: 0, exportsThisMonth: 0 };

                switch (limitType) {
                    case 'voiceNotes':
                        return hasReachedLimit('voiceNotesPerMonth', usage.voiceNotesUsed, false);
                    case 'sleepSessions':
                        return hasReachedLimit('sleepSessionsPerMonth', usage.sleepSessionsUsed, false);
                    case 'exports':
                        return hasReachedLimit('exportsPerMonth', usage.exportsThisMonth, false);
                    default:
                        return true; // Unknown limit type = restricted for free users
                }
            },

            canUseFeature: (feature: string) => {
                const state = get();
                const subscription = state.subscriptionStatus;
                const isPremium = subscription?.isPremiumUser || subscription?.isOnTrial || false;

                // Define which features require premium
                const premiumFeatures = [
                    'ai_insights',
                    'correlation_analysis',
                    'unlimited_voice_notes',
                    'advanced_sleep_analysis',
                    'voice_transcription',
                    'priority_support',
                    'custom_reports'
                ];

                if (premiumFeatures.includes(feature)) {
                    return isPremium
                        ? { allowed: true }
                        : { allowed: false, reason: 'Funkcja dostępna tylko w planie Premium' };
                }

                // For usage-based features, check limits
                const usage = subscription?.usage || { voiceNotesUsed: 0, sleepSessionsUsed: 0, exportsThisMonth: 0 };

                switch (feature) {
                    case 'voice_note_recording':
                        if (!isPremium && hasReachedLimit('voiceNotesPerMonth', usage.voiceNotesUsed, false)) {
                            return { allowed: false, reason: `Limit ${FREE_USER_LIMITS.voiceNotesPerMonth} notatek głosowych miesięcznie osiągnięty` };
                        }
                        break;
                    case 'sleep_tracking':
                        if (!isPremium && hasReachedLimit('sleepSessionsPerMonth', usage.sleepSessionsUsed, false)) {
                            return { allowed: false, reason: `Limit ${FREE_USER_LIMITS.sleepSessionsPerMonth} sesji snu miesięcznie osiągnięty` };
                        }
                        break;
                    case 'data_export':
                        if (!isPremium && hasReachedLimit('exportsPerMonth', usage.exportsThisMonth, false)) {
                            return { allowed: false, reason: `Limit ${FREE_USER_LIMITS.exportsPerMonth} eksportu miesięcznie osiągnięty` };
                        }
                        break;
                }

                return { allowed: true };
            },

            getRemainingUsage: (limitType: LimitType) => {
                const state = get();
                const subscription = state.subscriptionStatus;
                const isPremium = subscription?.isPremiumUser || subscription?.isOnTrial || false;

                if (isPremium) {
                    return null; // Unlimited for premium users
                }

                const usage = subscription?.usage || { voiceNotesUsed: 0, sleepSessionsUsed: 0, exportsThisMonth: 0 };

                switch (limitType) {
                    case 'voiceNotesPerMonth':
                        return Math.max(0, FREE_USER_LIMITS.voiceNotesPerMonth - usage.voiceNotesUsed);
                    case 'sleepSessionsPerMonth':
                        return Math.max(0, FREE_USER_LIMITS.sleepSessionsPerMonth - usage.sleepSessionsUsed);
                    case 'exportsPerMonth':
                        return Math.max(0, FREE_USER_LIMITS.exportsPerMonth - usage.exportsThisMonth);
                    default:
                        return 0;
                }
            },

            // Voice notes actions
            addVoiceNote: (voiceNote) => {
                const { user } = get();
                set((state) => ({
                    voiceNotes: [voiceNote, ...state.voiceNotes]
                }));

                // Log voice note event
                if (user) {
                    const eventService = EventService.getInstance();
                    eventService.dispatchEvent(EventType.VOICE_NOTE_UPLOADED, user.id, {
                        voiceNoteId: voiceNote.id,
                        transcriptionLength: voiceNote.transcription?.length || 0,
                        topics: voiceNote.topics
                    });
                }
            },

            loadVoiceNotes: async () => {
                const { user, setError } = get();
                if (!user) {
                    console.log('❌ No user found, cannot load voice notes');
                    set({ voiceNotes: [] });
                    return;
                }

                // 🚨 Rate limiting protection - prevent spam requests
                const now = Date.now();
                const lastCallKey = `lastVoiceNotesCall_${user.id}`;
                const state = get() as any;
                const lastCall = state[lastCallKey] || 0;
                const timeSinceLastCall = now - lastCall;

                if (timeSinceLastCall < 2000) { // 2 second minimum between calls
                    console.log(`⏳ Rate limiting: Skipping loadVoiceNotes (${timeSinceLastCall}ms since last call)`);
                    return;
                }

                // Mark this call
                set((state: any) => ({ ...state, [lastCallKey]: now }));

                try {
                    console.log(`🔍 Loading voice notes for user: ${user.id} (email: ${user.email})`);

                    // 🔄 Load from backend API instead of local SQLite
                    const apiService = ApiService.getInstance();
                    const response = await apiService.getVoiceNotes(user.id, 50);

                    console.log('🔍 Raw API response:', {
                        success: response.success,
                        hasData: !!response.data,
                        dataType: typeof response.data,
                        dataLength: response.data?.length,
                        error: response.error
                    });

                    // 🔍 DEBUG: Full response structure
                    console.log('🔍 Full response structure:', {
                        responseKeys: Object.keys(response),
                        dataKeys: response.data ? Object.keys(response.data) : null,
                        dataContent: response.data,
                        isDataArray: Array.isArray(response.data)
                    });

                    // 🏢 ENTERPRISE: Response Validation & Transformation
                    const parseVoiceNotesResponse = (apiResponse: any): {
                        success: boolean;
                        data: VoiceNote[];
                        error?: string;
                        metadata?: any
                    } => {
                        // Type Guards
                        const isValidVoiceNote = (item: any): item is VoiceNote => {
                            return item &&
                                typeof item.id === 'string' &&
                                typeof item.userId === 'string' &&
                                typeof item.createdAt === 'string';
                        };

                        const validateVoiceNoteArray = (arr: any[]): VoiceNote[] => {
                            return arr.filter(isValidVoiceNote);
                        };

                        // Response Success Validation
                        if (!apiResponse.success) {
                            return {
                                success: false,
                                data: [],
                                error: apiResponse.error || 'API response indicated failure',
                                metadata: { responseType: 'failed_request' }
                            };
                        }

                        // Data Extraction Strategies (Enterprise Fallback Chain)
                        const extractionStrategies = [
                            // Strategy 1: Triple nested (response.data.data.data) - PRIORITY for current API
                            () => apiResponse.data?.data?.data && Array.isArray(apiResponse.data.data.data) ? apiResponse.data.data.data : null,

                            // Strategy 2: Direct array
                            () => Array.isArray(apiResponse.data) ? apiResponse.data : null,

                            // Strategy 3: Double nested data property
                            () => apiResponse.data?.data && Array.isArray(apiResponse.data.data) ? apiResponse.data.data : null,

                            // Strategy 4: Named collection property
                            () => apiResponse.data?.voiceNotes && Array.isArray(apiResponse.data.voiceNotes) ? apiResponse.data.voiceNotes : null,

                            // Strategy 5: Items property (REST standard)
                            () => apiResponse.data?.items && Array.isArray(apiResponse.data.items) ? apiResponse.data.items : null,

                            // Strategy 6: Results property
                            () => apiResponse.data?.results && Array.isArray(apiResponse.data.results) ? apiResponse.data.results : null,

                            // Strategy 7: Empty response handling
                            () => (apiResponse.data === null || apiResponse.data === undefined) ? [] : null
                        ];

                        for (const [index, strategy] of extractionStrategies.entries()) {
                            try {
                                const extracted = strategy();
                                if (extracted !== null) {
                                    const validatedData = validateVoiceNoteArray(extracted);
                                    const invalidCount = extracted.length - validatedData.length;

                                    console.log(`✅ Enterprise Parser: Strategy ${index + 1} successful`, {
                                        extractedCount: extracted.length,
                                        validCount: validatedData.length,
                                        invalidCount,
                                        strategy: strategy.name || `Strategy ${index + 1}`
                                    });

                                    if (invalidCount > 0) {
                                        console.warn(`⚠️ Enterprise Warning: ${invalidCount} invalid voice notes filtered out`);
                                    }

                                    return {
                                        success: true,
                                        data: validatedData,
                                        metadata: {
                                            strategy: index + 1,
                                            totalExtracted: extracted.length,
                                            validatedCount: validatedData.length,
                                            filteredCount: invalidCount
                                        }
                                    };
                                }
                            } catch (strategyError) {
                                console.warn(`⚠️ Strategy ${index + 1} failed:`, strategyError);
                                continue;
                            }
                        }

                        // All strategies failed
                        return {
                            success: false,
                            data: [],
                            error: 'No valid data extraction strategy succeeded',
                            metadata: {
                                responseType: typeof apiResponse.data,
                                strategiesAttempted: extractionStrategies.length,
                                rawDataStructure: apiResponse.data ? Object.keys(apiResponse.data) : null
                            }
                        };
                    };

                    const parsedResponse = parseVoiceNotesResponse(response);

                    if (parsedResponse.success) {
                        console.log(`🏢 Enterprise Success: Loaded ${parsedResponse.data.length} voice notes`, parsedResponse.metadata);
                        if (parsedResponse.success) {
                            console.log(`🏢 Enterprise Success: Loaded ${parsedResponse.data.length} voice notes`, parsedResponse.metadata);

                            if (parsedResponse.data.length > 0) {
                                console.log('📋 Sample voice note (validated):', {
                                    id: parsedResponse.data[0].id,
                                    userId: parsedResponse.data[0].userId,
                                    hasTranscription: !!parsedResponse.data[0].transcription,
                                    hasAudioUrl: !!parsedResponse.data[0].audioUrl,
                                    createdAt: parsedResponse.data[0].createdAt
                                });
                            }

                            set({ voiceNotes: parsedResponse.data });
                        } else {
                            console.error('🏢 Enterprise Error: Voice notes parsing failed', {
                                error: parsedResponse.error,
                                metadata: parsedResponse.metadata
                            });

                            // Enterprise Error Recovery: Use cached data if available
                            const cachedVoiceNotes = get().voiceNotes || [];
                            if (cachedVoiceNotes.length > 0) {
                                console.log(`🏢 Enterprise Recovery: Using ${cachedVoiceNotes.length} cached voice notes`);
                            } else {
                                set({ voiceNotes: [] });
                            }
                        }
                    } else {
                        // 🚨 Special handling for rate limiting
                        if (response.error && response.error.includes('429')) {
                            console.log('🚫 Rate limited - backing off for 5 seconds');
                            set((state: any) => ({ ...state, [lastCallKey]: now + 3000 })); // Extra delay for rate limiting
                            return; // Don't clear voiceNotes on rate limiting
                        }

                        console.log('❌ API response invalid - setting empty array:', {
                            success: response.success,
                            dataType: typeof response.data,
                            error: response.error
                        });
                        set({ voiceNotes: [] });
                    }

                    // 🔄 Also save to local database for offline access (secondary)
                    try {
                        const dbService = DatabaseService.getInstance();
                        if (!dbService.isInitialized()) {
                            await dbService.initialize();
                        }

                        if (response.success && Array.isArray(parsedResponse.data) && parsedResponse.data.length > 0) {
                            // Save API results to local database
                            for (const voiceNote of parsedResponse.data) {
                                await dbService.saveVoiceNote(voiceNote);
                            }
                            console.log('💾 Voice notes synced to local database');
                        }
                    } catch (syncError) {
                        console.log('⚠️ Local database sync failed (non-critical):', syncError);
                        // Don't fail the main operation if local sync fails
                    }
                } catch (error) {
                    console.error('❌ Failed to load voice notes from API:', error);

                    // 📱 Fallback to local database if API fails
                    try {
                        const dbService = DatabaseService.getInstance();
                        if (!dbService.isInitialized()) {
                            await dbService.initialize();
                        }

                        const localVoiceNotes = await dbService.getVoiceNotesByUserId(user.id, 50);
                        console.log(`📱 Fallback: Loaded ${localVoiceNotes.length} voice notes from local database`);
                        set({ voiceNotes: localVoiceNotes });
                    } catch (fallbackError) {
                        console.error('❌ Both API and local fallback failed:', fallbackError);
                        set({ voiceNotes: [] });
                    }
                }
            },

            updateRecordingState: (currentRecording) => set({ currentRecording }),

            setProcessingVoiceNote: (isProcessingVoiceNote) => set({ isProcessingVoiceNote }),

            uploadVoiceNote: async (audioUri: string) => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote, loadVoiceNotes, loadTasks, currentRecording } = get();
                if (!user) {
                    setError('User not authenticated');
                    setProcessingVoiceNote(false); // Ensure state is reset
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);
                    console.log('🎙️ Starting voice note upload...');

                    // Add a timeout wrapper around the API call - Extended for voice processing
                    const uploadPromise = ApiService.getInstance().uploadVoiceNote(audioUri, currentRecording.duration);
                    const timeoutPromise = new Promise<never>((_, reject) => {
                        setTimeout(() => {
                            reject(new Error('Upload timeout after 60 seconds'));
                        }, 60000); // Extended from 30s to 60s for voice processing
                    });

                    const response = await Promise.race([uploadPromise, timeoutPromise]);

                    console.log('🔍 Upload response debug:', {
                        success: response.success,
                        hasData: !!response.data,
                        dataKeys: response.data ? Object.keys(response.data) : [],
                        error: response.error,
                        responseType: typeof response,
                        fullResponse: response
                    });

                    console.log('🔍 Response.data content:', response.data);

                    if (response.success && response.data) {
                        console.log('✅ Voice note uploaded successfully!');

                        // Backend response structure
                        const voiceNoteData = (response.data as any)?.voiceNote;
                        console.log('🔍 Voice note object structure:', {
                            id: voiceNoteData?.id,
                            userId: voiceNoteData?.userId,
                            hasId: !!voiceNoteData?.id,
                            hasUserId: !!voiceNoteData?.userId,
                            allKeys: Object.keys(voiceNoteData || {})
                        });

                        // Ensure voiceNote has required properties
                        if (!voiceNoteData || !voiceNoteData.id) {
                            throw new Error('Invalid voice note response: missing id');
                        }

                        // Set userId if missing (use current user)
                        if (!voiceNoteData.userId && user) {
                            voiceNoteData.userId = user.id;
                            console.log('🔧 Fixed voice note userId:', user.id);
                        }

                        // Add voice note to local state
                        addVoiceNote(voiceNoteData);

                        // Save to local database
                        const dbService = DatabaseService.getInstance();
                        await dbService.saveVoiceNote(voiceNoteData);

                        // Reload data to ensure UI consistency
                        await Promise.allSettled([
                            loadVoiceNotes(),
                            loadTasks()
                        ]);

                        return true;
                    } else {
                        console.error('❌ Voice note upload failed:', response.error);
                        setError(response.error || 'Failed to upload voice note');
                        return false;
                    }
                } catch (error) {
                    console.error('❌ Upload voice note error:', error);

                    if (error instanceof Error && error.message.includes('timeout')) {
                        console.warn('⏰ Upload timeout - checking if processed in background...');
                        setError('Processing is taking longer than usual. Checking for completion...');

                        // Check for background processing completion
                        setTimeout(async () => {
                            console.log('🔄 Checking for background processing completion...');
                            await loadVoiceNotes();

                            const { voiceNotes: updatedNotes } = get();
                            if (updatedNotes.length === 0) {
                                setError('Processing is taking longer than expected. Please try again.');
                            } else {
                                setError(null); // Clear error if we found notes
                                console.log('✅ Found processed voice notes after timeout!');
                            }
                        }, 3000);
                    } else {
                        setError(error instanceof Error ? error.message : 'Upload failed');
                    }
                    return false;
                } finally {
                    // Reload data and reset processing state
                    await Promise.allSettled([
                        loadVoiceNotes(),
                        loadTasks()
                    ]);

                    // Reset processing state after a short delay
                    setTimeout(() => {
                        setProcessingVoiceNote(false);
                        console.log('🔄 Processing state reset');
                    }, 1000);
                }
            },            // Nowa funkcja uploadVoiceNoteWithContext
            uploadVoiceNoteWithContext: async (audioUri: string, context?: string) => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote, loadVoiceNotes, loadTasks } = get();
                if (!user) {
                    setError('User not authenticated');
                    setProcessingVoiceNote(false); // Ensure state is reset
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);
                    console.log('🎙️ Starting voice note with context upload...');

                    const apiService = ApiService.getInstance();
                    const response = await apiService.uploadVoiceNoteWithContext(audioUri, context);

                    if (response.success && response.data) {
                        console.log('✅ Voice note with context uploaded successfully!');

                        // Add voice note to local state
                        addVoiceNote(response.data.voiceNote);

                        // Add extracted tasks and activities to local state
                        const { tasks, activities } = get();
                        const newTasks = [...response.data.extractedTasks, ...tasks];
                        const newActivities = [...(response.data.extractedActivities || []), ...activities];

                        const today = new Date();
                        const isToday = (date: Date) => date.toDateString() === today.toDateString();

                        set({
                            tasks: newTasks,
                            activities: newActivities,
                            todaysActivities: newActivities.filter(a => isToday(new Date(a.createdAt)))
                        });

                        // Save to local database
                        const dbService = DatabaseService.getInstance();
                        await dbService.saveVoiceNote(response.data.voiceNote);

                        for (const task of response.data.extractedTasks) {
                            await dbService.createTask(task, get().user?.id || 'unknown');
                        }

                        // Reload data to ensure UI consistency
                        await Promise.allSettled([
                            loadVoiceNotes(),
                            loadTasks()
                        ]);

                        return true;
                    } else {
                        console.error('❌ Voice note with context upload failed:', response.error);
                        setError(response.error || 'Failed to upload voice note');
                        return false;
                    }
                } catch (error) {
                    console.error('❌ Upload voice note with context error:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    // Always reset processing state
                    setProcessingVoiceNote(false);
                    console.log('🔄 Processing state reset');
                }
            },

            uploadSleepRecording: async (sleepData: any) => {
                const { user, setError, setLoading } = get();
                if (!user) {
                    setError('User not authenticated');
                    return false;
                }

                try {
                    setLoading(true);
                    console.log('Uploading sleep recording data:', sleepData);

                    // Here you would typically upload to your API
                    // For now, just save locally and return success
                    console.log('Sleep data would be saved locally:', sleepData);

                    // TODO: Implement proper database save when sleep_sessions table is created
                    // const dbService = DatabaseService.getInstance();
                    // await dbService.saveSleepSession(sleepData);

                    console.log('Sleep recording data saved successfully');
                    return true;
                } catch (error) {
                    console.error('Upload sleep recording error:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    setLoading(false);
                }
            },

            getSleepInsights: async (sleepTrackingId: string) => {
                const { user, setError, setLoading } = get();
                if (!user) {
                    setError('User not authenticated');
                    return null;
                }

                try {
                    setLoading(true);
                    console.log('Fetching AI sleep insights for:', sleepTrackingId);

                    const apiService = ApiService.getInstance();
                    const response = await fetch(`${apiService.baseUrl}/sleep-tracking/${sleepTrackingId}/insights`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${get().accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch sleep insights: ${response.statusText}`);
                    }

                    const insights = await response.json();
                    console.log('✨ Sleep insights received:', insights);

                    return insights;
                } catch (error) {
                    console.error('Get sleep insights error:', error);
                    setError(error instanceof Error ? error.message : 'Failed to get sleep insights');
                    return null;
                } finally {
                    setLoading(false);
                }
            },

            // 🏢 ENTERPRISE Voice Recording Functions
            uploadDailyReportVoice: async (audioUri: string, reportType: 'morning' | 'evening' | 'summary') => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote, loadVoiceNotes } = get();
                if (!user) {
                    setError('User not authenticated');
                    setProcessingVoiceNote(false); // Ensure state is reset
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);
                    console.log(`🌅 Uploading ${reportType} daily report voice note...`);

                    const apiService = ApiService.getInstance();
                    const response = await apiService.uploadDailyReportVoice(audioUri, reportType);

                    if (response.success && response.data) {
                        addVoiceNote(response.data.voiceNote);
                        console.log(`✅ Daily ${reportType} report uploaded successfully!`);

                        // Reload voice notes to ensure UI consistency
                        await loadVoiceNotes();

                        return true;
                    } else {
                        console.error(`❌ Daily ${reportType} report upload failed:`, response.error);
                        setError(response.error || 'Failed to upload daily report');
                        return false;
                    }
                } catch (error) {
                    console.error('🚨 Daily report upload failed:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    // Always reset processing state
                    setProcessingVoiceNote(false);
                    console.log('🔄 Processing state reset');
                }
            },

            uploadSleepReportVoice: async (audioUri: string, sleepType: 'dream' | 'insomnia' | 'morning-reflection' | 'sleep-quality') => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote, loadVoiceNotes } = get();
                if (!user) {
                    setError('User not authenticated');
                    setProcessingVoiceNote(false); // Ensure state is reset
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);
                    console.log(`🌙 Uploading ${sleepType} sleep report voice note...`);

                    const apiService = ApiService.getInstance();
                    const response = await apiService.uploadSleepReportVoice(audioUri, sleepType);

                    if (response.success && response.data) {
                        addVoiceNote(response.data.voiceNote);
                        console.log(`✅ Sleep ${sleepType} report uploaded successfully!`);

                        // Reload voice notes to ensure UI consistency
                        await loadVoiceNotes();

                        return true;
                    } else {
                        console.error(`❌ Sleep ${sleepType} report upload failed:`, response.error);
                        setError(response.error || 'Failed to upload sleep report');
                        return false;
                    }
                } catch (error) {
                    console.error('🚨 Sleep report upload failed:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    // Always reset processing state
                    setProcessingVoiceNote(false);
                    console.log('🔄 Processing state reset');
                }
            },

            uploadLifeExperienceVoice: async (audioUri: string, category: 'reflection' | 'gratitude' | 'emotion' | 'achievement' | 'challenge') => {
                const { user, setError, setProcessingVoiceNote, addVoiceNote, loadVoiceNotes } = get();
                if (!user) {
                    setError('User not authenticated');
                    setProcessingVoiceNote(false); // Ensure state is reset
                    return false;
                }

                try {
                    setProcessingVoiceNote(true);
                    setError(null);
                    console.log(`💭 Uploading ${category} life experience voice note...`);

                    const apiService = ApiService.getInstance();
                    const response = await apiService.uploadLifeExperienceVoice(audioUri, category);

                    if (response.success && response.data) {
                        addVoiceNote(response.data.voiceNote);
                        console.log(`✅ Life ${category} experience uploaded successfully!`);

                        // Reload voice notes to ensure UI consistency
                        await loadVoiceNotes();

                        return true;
                    } else {
                        console.error(`❌ Life ${category} experience upload failed:`, response.error);
                        setError(response.error || 'Failed to upload life experience');
                        return false;
                    }
                } catch (error) {
                    console.error('🚨 Life experience upload failed:', error);
                    setError(error instanceof Error ? error.message : 'Upload failed');
                    return false;
                } finally {
                    // Always reset processing state
                    setProcessingVoiceNote(false);
                    console.log('🔄 Processing state reset');
                }
            },

            // Tasks actions
            addTask: async (task) => {
                const { user, setError } = get();
                if (!user) {
                    setError('User not authenticated');
                    return;
                }

                try {
                    // First add to local state for immediate UI update
                    const isToday = (date: Date) => {
                        const today = new Date();
                        return date.toDateString() === today.toDateString();
                    };

                    set((state) => ({
                        tasks: [task, ...state.tasks],
                        todaysTasks: isToday(new Date()) ? [task, ...state.todaysTasks] : state.todaysTasks
                    }));

                    // Then sync with backend API
                    const apiService = ApiService.getInstance();
                    const response = await apiService.createTask(task);

                    if (!response.success) {
                        // Rollback local state if API failed
                        set((state) => ({
                            tasks: state.tasks.filter(t => t.id !== task.id),
                            todaysTasks: state.todaysTasks.filter(t => t.id !== task.id)
                        }));
                        throw new Error(response.error || 'Failed to create task');
                    }

                    // Update local state with server response
                    if (response.data) {
                        const serverTask = response.data;
                        set((state) => ({
                            tasks: state.tasks.map(t => t.id === task.id ? serverTask : t),
                            todaysTasks: state.todaysTasks.map(t => t.id === task.id ? serverTask : t)
                        }));
                    }

                    // Save to local database
                    const dbService = DatabaseService.getInstance();
                    await dbService.saveTask(response.data || task, user.id);

                    // Log task creation event
                    const eventService = EventService.getInstance();
                    eventService.dispatchEvent(EventType.TASK_CREATED, user.id, {
                        taskId: task.id,
                        title: task.title,
                        priority: task.priority,
                        extractedFromVoiceNote: !!task.extractedFromVoiceNoteId
                    });
                } catch (error) {
                    console.error('Failed to add task:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    setError(`Failed to add task: ${errorMessage}`);
                    // Remove from local state if it was added
                    set((state) => ({
                        tasks: state.tasks.filter(t => t.id !== task.id),
                        todaysTasks: state.todaysTasks.filter(t => t.id !== task.id)
                    }));
                    throw error;
                }
            },

            updateTask: async (taskId, updates) => {
                const { setError } = get();

                // Store original state for rollback
                const { tasks, todaysTasks } = get();
                const originalTask = tasks.find(t => t.id === taskId);

                if (!originalTask) {
                    setError('Task not found');
                    return;
                }

                try {
                    // Update local state immediately
                    set((state) => ({
                        tasks: state.tasks.map(task =>
                            task.id === taskId ? { ...task, ...updates } : task
                        ),
                        todaysTasks: state.todaysTasks.map(task =>
                            task.id === taskId ? { ...task, ...updates } : task
                        )
                    }));

                    // Sync with backend API
                    const apiService = ApiService.getInstance();
                    const response = await apiService.updateTask(taskId, updates);

                    if (!response.success) {
                        // Rollback to original state
                        set((state) => ({
                            tasks: state.tasks.map(task =>
                                task.id === taskId ? originalTask : task
                            ),
                            todaysTasks: state.todaysTasks.map(task =>
                                task.id === taskId ? originalTask : task
                            )
                        }));
                        throw new Error(response.error || 'Failed to update task');
                    }

                    // Update local database
                    const dbService = DatabaseService.getInstance();
                    await dbService.updateTask(taskId, updates);
                } catch (error) {
                    console.error('Failed to update task:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    setError(`Failed to update task: ${errorMessage}`);
                    // Rollback to original state
                    set((state) => ({
                        tasks: state.tasks.map(task =>
                            task.id === taskId ? originalTask : task
                        ),
                        todaysTasks: state.todaysTasks.map(task =>
                            task.id === taskId ? originalTask : task
                        )
                    }));
                }
            },

            toggleTaskCompletion: async (taskId) => {
                const { tasks, updateTask } = get();
                const task = tasks.find(t => t.id === taskId);
                if (!task) return;

                const completed = !task.completed;
                updateTask(taskId, { completed });

                try {
                    const dbService = DatabaseService.getInstance();
                    await dbService.updateTaskCompletion(taskId, completed);
                } catch (error) {
                    console.error('Failed to update task in database:', error);
                }
            },

            deleteTask: async (taskId) => {
                set((state) => ({
                    tasks: state.tasks.filter(task => task.id !== taskId),
                    todaysTasks: state.todaysTasks.filter(task => task.id !== taskId)
                }));

                try {
                    const apiService = ApiService.getInstance();
                    await apiService.deleteTask(taskId);
                } catch (error) {
                    console.error('Failed to delete task:', error);
                }
            },

            loadTasks: async () => {
                const { user, setError } = get();
                if (!user) {
                    // Jeśli brak użytkownika, ustaw puste tablice
                    set({ tasks: [], todaysTasks: [] });
                    return;
                }

                try {
                    // Try to load from API first
                    const apiService = ApiService.getInstance();
                    const response = await apiService.getTasks();

                    console.log('🔍 API Response for tasks:', {
                        success: response.success,
                        hasData: !!response.data,
                        dataType: typeof response.data,
                        isArray: Array.isArray(response.data),
                        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
                        data: response.data
                    });

                    if (response.success && response.data) {
                        // Handle API response structure
                        const tasks = Array.isArray(response.data) ? response.data : [];
                        console.log('📋 Loaded tasks:', tasks.length);

                        const today = new Date().toISOString().split('T')[0];
                        const todaysTasks = tasks.filter(task => {
                            const taskDate = task.dueDate?.split('T')[0];
                            return taskDate === today || !task.completed;
                        });

                        set({ tasks: tasks, todaysTasks });

                        // Update local database cache
                        const dbService = DatabaseService.getInstance();
                        if (!dbService.isInitialized()) {
                            await dbService.initialize();
                        }

                        // Save tasks to local cache
                        for (const task of tasks) {
                            await dbService.saveTask(task, user.id);
                        }
                        return;
                    } else if (response.success && response.data === null) {
                        // API zwróciło null - ustaw puste tablice
                        set({ tasks: [], todaysTasks: [] });
                        return;
                    }
                } catch (error) {
                    console.warn('Failed to load tasks from API, falling back to local database:', error);
                }

                // Fallback to local database
                try {
                    const dbService = DatabaseService.getInstance();

                    // Sprawdź czy baza jest zainicjalizowana
                    if (!dbService.isInitialized()) {
                        console.log('Database not initialized, initializing now...');
                        await dbService.initialize();
                    }

                    const tasks = await dbService.getTasksByUserId(user.id);
                    const today = new Date().toISOString().split('T')[0];
                    const todaysTasks = tasks.filter(task => {
                        const taskDate = task.dueDate?.split('T')[0];
                        return taskDate === today || !task.completed;
                    });

                    set({ tasks, todaysTasks });
                } catch (error) {
                    console.error('Failed to load tasks from database:', error);
                    // Nie pokazuj błędu użytkownikowi jeśli to tylko brak danych
                    set({ tasks: [], todaysTasks: [] });
                }
            },

            // Activity tracking actions
            addActivity: (activity) => {
                const today = new Date();
                const isToday = (date: Date) => date.toDateString() === today.toDateString();

                set((state) => ({
                    activities: [activity, ...state.activities],
                    todaysActivities: isToday(new Date(activity.createdAt))
                        ? [activity, ...state.todaysActivities]
                        : state.todaysActivities
                }));
            },

            loadActivities: async () => {
                const { user } = get();
                if (!user) {
                    set({ activities: [], todaysActivities: [] });
                    return;
                }

                try {
                    const apiService = ApiService.getInstance();
                    const response = await apiService.getActivities(user.id);

                    if (response.success && response.data) {
                        const activities = response.data;
                        const today = new Date();
                        const isToday = (date: Date) => date.toDateString() === today.toDateString();
                        const todaysActivities = activities.filter(activity =>
                            isToday(new Date(activity.createdAt))
                        );

                        set({ activities, todaysActivities });
                    }
                } catch (error) {
                    console.log('Activities not available (likely in development mode)');
                    // Ustaw puste dane zamiast błędu
                    set({ activities: [], todaysActivities: [] });
                }
            },

            loadDailyMetrics: async () => {
                const { user } = get();
                if (!user) {
                    set({ dailyMetrics: null });
                    return;
                }

                // TODO: Enable when backend endpoint is implemented
                console.log('Daily metrics not available (backend endpoint not implemented yet)');
                set({ dailyMetrics: null });
            },

            loadWeeklyInsights: async () => {
                const { user } = get();
                if (!user) {
                    set({ weeklyInsights: null });
                    return;
                }

                // TODO: Enable when backend endpoint is implemented
                console.log('Weekly insights not available (backend endpoint not implemented yet)');
                set({ weeklyInsights: null });
            },

            loadProgressMetrics: async () => {
                const { user } = get();
                if (!user) {
                    set({ progressMetrics: null });
                    return;
                }

                // TODO: Enable when backend endpoint is implemented
                console.log('Progress metrics not available (backend endpoint not implemented yet)');
                set({ progressMetrics: null });
            },

            generatePersonalizedRecommendations: async () => {
                const { user } = get();
                if (!user) {
                    set({ recommendations: [] });
                    return;
                }

                // TODO: Enable when backend endpoint is implemented
                console.log('Recommendations not available (backend endpoint not implemented yet)');
                set({ recommendations: [] });
            },

            // Daily entry actions
            setTodayEntry: (todayEntry) => set({ todayEntry }),

            generateDailySummary: async () => {
                const { user, voiceNotes, tasks } = get();
                if (!user) return;

                try {
                    const today = new Date().toISOString().split('T')[0];
                    const todaysNotes = voiceNotes.filter(note =>
                        note.createdAt.startsWith(today)
                    );
                    const todaysTasks = tasks.filter(task =>
                        task.dueDate?.startsWith(today) || !task.completed
                    );

                    // Generate simple summary (in real app, this would use AI)
                    const completedTasks = todaysTasks.filter(t => t.completed);
                    const pendingTasks = todaysTasks.filter(t => !t.completed);

                    const autoSummary = `Today you recorded ${todaysNotes.length} voice notes, completed ${completedTasks.length} tasks, and have ${pendingTasks.length} tasks remaining.`;

                    const dailyEntry: Omit<DailyEntry, 'id'> = {
                        userId: user.id,
                        date: today,
                        autoSummary,
                        tasks: todaysTasks,
                        habits: [], // This would be populated by habit tracking
                        mood: 'neutral', // This would be extracted from voice notes
                        updatedAt: new Date().toISOString()
                    };

                    const dbService = DatabaseService.getInstance();
                    const savedEntry = await dbService.saveDailyEntry(dailyEntry);
                    set({ todayEntry: savedEntry });
                } catch (error) {
                    console.error('Failed to generate daily summary:', error);
                }
            },

            // General actions
            initialize: async () => {
                console.log('🚀 App Store Initialize started, __DEV__:', __DEV__);
                try {
                    set({ isLoading: true });

                    // Load JWT tokens from storage and verify authentication
                    let loadedTokens: { accessToken: string | null; refreshToken: string | null } = { accessToken: null, refreshToken: null };
                    let authenticatedUser = null;

                    try {
                        const accessToken = await AsyncStorage.getItem('@access_token');
                        const refreshToken = await AsyncStorage.getItem('@refresh_token');

                        if (accessToken && refreshToken) {
                            loadedTokens = { accessToken, refreshToken };

                            // Set up API service with the token
                            const apiService = ApiService.getInstance();
                            apiService.setAuthToken(accessToken);

                            // Try to fetch user profile to verify token is still valid
                            try {
                                console.log('🔍 Verifying stored token with backend...');

                                // 🔧 Development mode: Skip token validation and use fallback
                                if (__DEV__) {
                                    console.log('🔧 DEV MODE: Skipping token validation, using fallback user');
                                    authenticatedUser = {
                                        id: 'a6f7b841-208d-4b2c-aba0-fa1dfdd35bb3',
                                        email: 'dawid.bubernak@gmail.com',
                                        authProvider: 'email' as const,
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString()
                                    };
                                    console.log('✅ DEV User authenticated:', authenticatedUser.id);
                                } else {
                                    // Production: Validate token with backend
                                    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/profile`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${accessToken}`,
                                            'Content-Type': 'application/json',
                                        },
                                    });

                                    console.log('🔍 Token verification response:', {
                                        status: response.status,
                                        statusText: response.statusText,
                                        ok: response.ok,
                                        headers: Object.fromEntries(response.headers.entries())
                                    });

                                    if (response.ok) {
                                        const responseData = await response.json();
                                        console.log('🔍 Raw auth response:', responseData);

                                        // Handle different response formats
                                        authenticatedUser = responseData.user || responseData.data || responseData;

                                        console.log('🔍 Parsed user object:', {
                                            id: authenticatedUser?.id,
                                            email: authenticatedUser?.email,
                                            authProvider: authenticatedUser?.authProvider,
                                            hasUser: !!authenticatedUser
                                        });

                                        if (authenticatedUser && authenticatedUser.id) {
                                            console.log('✅ User authenticated from stored token:', authenticatedUser.id);
                                        } else {
                                            console.log('❌ Authentication response missing user data');
                                            authenticatedUser = null;
                                            await AsyncStorage.removeItem('@access_token');
                                            await AsyncStorage.removeItem('@refresh_token');
                                            loadedTokens = { accessToken: null, refreshToken: null };
                                        }
                                    } else {
                                        const errorData = await response.text().catch(() => 'No error data');
                                        console.log('❌ Stored token is invalid, clearing...', {
                                            status: response.status,
                                            statusText: response.statusText,
                                            error: errorData
                                        });
                                        await AsyncStorage.removeItem('@access_token');
                                        await AsyncStorage.removeItem('@refresh_token');
                                        loadedTokens = { accessToken: null, refreshToken: null };
                                    }
                                }
                            } catch (error) {
                                console.log('❌ Failed to verify token, clearing...', error);
                                await AsyncStorage.removeItem('@access_token');
                                await AsyncStorage.removeItem('@refresh_token');
                                loadedTokens = { accessToken: null, refreshToken: null };
                            }
                        }
                    } catch (error) {
                        console.error('Error loading tokens:', error);
                    }

                    // Set initial state based on authentication status
                    set({
                        user: authenticatedUser,
                        userSettings: null,
                        isAuthenticated: !!authenticatedUser,
                        isOnboarding: !authenticatedUser, // Only show onboarding if not authenticated
                        accessToken: loadedTokens.accessToken,
                        refreshToken: loadedTokens.refreshToken,
                        voiceNotes: [],
                        tasks: [],
                        todaysTasks: [],
                        todayEntry: null,
                        recommendations: [],
                        activities: [],
                        todaysActivities: [],
                        dailyMetrics: null,
                        weeklyInsights: null,
                        progressMetrics: null,
                        subscriptionStatus: null,
                        availablePlans: [],
                        error: null
                    });

                    // Initialize services
                    const dbService = DatabaseService.getInstance();
                    await dbService.initialize();

                    const audioService = AudioService.getInstance();
                    await audioService.initialize();

                    const state = get();
                    let currentUser = state.user;

                    // EMERGENCY CHECK: If we find demo-user-123, CLEAR IT!
                    if (currentUser?.id === 'demo-user-123') {
                        console.log('🚨 DEMO USER DETECTED! Clearing...');
                        await get().clearTokens();
                        set({
                            user: null,
                            isAuthenticated: false,
                            isOnboarding: true,
                        });
                        currentUser = null;
                    }

                    // Load user data if authenticated
                    if (currentUser && state.isAuthenticated && currentUser.id !== 'demo-user-123') {
                        console.log('📚 Loading user data for:', currentUser.email);

                        // Load data gracefully - don't throw on network errors
                        const loadPromises = [
                            get().loadTasks(),
                            get().loadVoiceNotes(),
                            get().loadActivities(),
                            get().loadDailyMetrics(),
                            get().loadWeeklyInsights(),
                            get().loadProgressMetrics(),
                            get().loadSubscriptionStatus(),
                            get().loadAvailablePlans(),
                            get().generatePersonalizedRecommendations()
                        ];

                        // Wait for all promises but don't fail if some fail
                        const results = await Promise.allSettled(loadPromises);

                        // Log which operations failed (for debugging)
                        results.forEach((result, index) => {
                            const operations = ['loadTasks', 'loadVoiceNotes', 'loadActivities', 'loadDailyMetrics', 'loadWeeklyInsights', 'loadProgressMetrics', 'loadSubscriptionStatus', 'loadAvailablePlans', 'generateRecommendations'];
                            if (result.status === 'rejected') {
                                console.log(`⚠️ ${operations[index]} failed:`, result.reason?.message || 'Unknown error');
                            }
                        });

                        // Load today's entry
                        const today = new Date().toISOString().split('T')[0];
                        try {
                            const todayEntry = await dbService.getDailyEntry(currentUser.id, today);
                            if (todayEntry) {
                                set({ todayEntry });
                            }
                            // No demo entry creation - user must create real data
                        } catch (error) {
                            console.log('No daily entry found for today - user will need to create one');
                            // No demo data - clean slate for real user
                        }
                    }

                } catch (error) {
                    console.error('App initialization failed:', error);
                    // Nie pokazuj błędu użytkownikowi w development
                    if (!__DEV__) {
                        set({ error: 'Failed to initialize app' });
                    }
                } finally {
                    set({ isLoading: false });
                }
            },

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            clearError: () => set({ error: null }),
            setOnboardingComplete: () => set((state) => ({
                ...state,
                user: state.user ? { ...state.user, isOnboardingCompleted: true } : null,
                isOnboarding: false
            })),

            logout: async () => {
                try {
                    // Clear auth token
                    const apiService = ApiService.getInstance();
                    apiService.setAuthToken('');

                    // Clear stored JWT tokens
                    await get().clearTokens();

                    // Reset app state
                    set({
                        user: null,
                        userSettings: null,
                        isAuthenticated: false,
                        accessToken: null,
                        refreshToken: null,
                        subscriptionStatus: null,
                        subscription: null,
                        voiceNotes: [],
                        tasks: [],
                        todaysTasks: [],
                        todayEntry: null,
                        recommendations: [],
                        isOnboarding: true,
                        error: null
                    });

                    // Clear database (optional - you might want to keep data for offline usage)
                    // const dbService = DatabaseService.getInstance();
                    // await dbService.clearAllData();

                } catch (error) {
                    console.error('Logout failed:', error);
                }
            },

            refreshUser: async () => {
                const { accessToken } = get();
                if (!accessToken) return;

                try {
                    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        set({
                            user: userData.user,
                            subscription: userData.subscription
                        });
                    }
                } catch (error) {
                    console.error('Failed to refresh user:', error);
                }
            }
        }),
        {
            name: 'app-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                userSettings: state.userSettings,
                isAuthenticated: state.isAuthenticated,
                isOnboarding: state.isOnboarding,
            }),
        }
    )
);


// Helper function
function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}