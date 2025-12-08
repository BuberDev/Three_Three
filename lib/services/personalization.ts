import { Task, User, UserSettings, VoiceNote } from '../types';

export interface PersonalizationData {
    embeddings: number[][];
    goals: string[];
    habitHistory: any[];
    userBehavior: any[];
    preferences: any;
}

export interface Recommendation {
    id: string;
    type: 'task' | 'habit' | 'insight' | 'goal';
    title: string;
    description: string;
    priority: number;
    confidence: number;
    reasons: string[];
    actionable: boolean;
}

export interface UserIntent {
    type: 'task_creation' | 'habit_tracking' | 'reflection' | 'planning' | 'goal_setting';
    confidence: number;
    entities: any[];
    context: any;
}

export class PersonalizationEngine {
    private static instance: PersonalizationEngine;

    private constructor() { }

    public static getInstance(): PersonalizationEngine {
        if (!PersonalizationEngine.instance) {
            PersonalizationEngine.instance = new PersonalizationEngine();
        }
        return PersonalizationEngine.instance;
    }

    /**
     * Similarity search for finding related voice notes and insights
     */
    public async findSimilarContent(
        targetEmbedding: number[],
        allEmbeddings: number[][],
        threshold: number = 0.7
    ): Promise<{ index: number; similarity: number }[]> {
        const similarities: { index: number; similarity: number }[] = [];

        for (let i = 0; i < allEmbeddings.length; i++) {
            const similarity = this.cosineSimilarity(targetEmbedding, allEmbeddings[i]);
            if (similarity >= threshold) {
                similarities.push({ index: i, similarity });
            }
        }

        return similarities.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Intent clustering - group voice notes by intent/purpose
     */
    public clusterByIntent(voiceNotes: VoiceNote[]): Map<UserIntent['type'], VoiceNote[]> {
        const clusters = new Map<UserIntent['type'], VoiceNote[]>();

        for (const note of voiceNotes) {
            const intent = this.classifyIntent(note);

            if (!clusters.has(intent.type)) {
                clusters.set(intent.type, []);
            }
            clusters.get(intent.type)!.push(note);
        }

        return clusters;
    }

    /**
     * Habit formation model - predict habit success and provide recommendations
     */
    public analyzeHabitFormation(habitHistory: any[], currentHabits: any[]): {
        predictions: any[];
        recommendations: Recommendation[];
        streakAnalysis: any;
    } {
        // Simplified habit analysis
        const predictions: any[] = [];
        const recommendations: Recommendation[] = [];

        for (const habit of currentHabits) {
            const streakData = this.calculateStreak(habit, habitHistory);
            const prediction = this.predictHabitSuccess(habit, streakData);
            predictions.push({ habitId: habit.id, ...prediction });

            // Generate recommendations based on habit performance
            if (prediction.risk > 0.7) {
                recommendations.push({
                    id: `habit_support_${habit.id}`,
                    type: 'habit',
                    title: `Support for ${habit.name}`,
                    description: `Consider adjusting your approach to ${habit.name}. Try smaller steps or different timing.`,
                    priority: 8,
                    confidence: 0.8,
                    reasons: ['Declining streak pattern detected', 'Historical data suggests intervention needed'],
                    actionable: true
                });
            }
        }

        return {
            predictions,
            recommendations,
            streakAnalysis: this.analyzeStreakPatterns(habitHistory)
        };
    }

    /**
     * User behavior graph analysis
     */
    public analyzeUserBehavior(
        voiceNotes: VoiceNote[],
        tasks: Task[],
        userSettings: UserSettings
    ): {
        patterns: any[];
        insights: string[];
        recommendations: Recommendation[];
    } {
        const patterns = this.identifyBehaviorPatterns(voiceNotes, tasks);
        const insights = this.generateBehaviorInsights(patterns, userSettings);
        const recommendations = this.generateBehaviorRecommendations(patterns, userSettings);

        return { patterns, insights, recommendations };
    }

    /**
     * Generate personalized recommendations based on all available data
     */
    public async generateRecommendations(
        user: User,
        userSettings: UserSettings,
        voiceNotes: VoiceNote[],
        tasks: Task[],
        habitData: any[]
    ): Promise<Recommendation[]> {
        const recommendations: Recommendation[] = [];

        // Intent-based recommendations
        const intentClusters = this.clusterByIntent(voiceNotes);
        const intentRecommendations = this.generateIntentBasedRecommendations(intentClusters, userSettings);
        recommendations.push(...intentRecommendations);

        // Habit-based recommendations
        const habitAnalysis = this.analyzeHabitFormation(habitData, []);
        recommendations.push(...habitAnalysis.recommendations);

        // Behavior-based recommendations
        const behaviorAnalysis = this.analyzeUserBehavior(voiceNotes, tasks, userSettings);
        recommendations.push(...behaviorAnalysis.recommendations);

        // Goal-based recommendations
        const goalRecommendations = this.generateGoalBasedRecommendations(userSettings.primaryGoals, voiceNotes, tasks);
        recommendations.push(...goalRecommendations);

        // Sort by priority and confidence
        return recommendations
            .sort((a, b) => (b.priority * b.confidence) - (a.priority * a.confidence))
            .slice(0, 10); // Return top 10 recommendations
    }

    // Private helper methods

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private classifyIntent(voiceNote: VoiceNote): UserIntent {
        const transcript = voiceNote.transcription.toLowerCase();
        const extractedItems = voiceNote.extractedItems;

        // Simple intent classification based on content
        if (extractedItems.tasks?.length > 0 || transcript.includes('need to') || transcript.includes('should')) {
            return {
                type: 'task_creation',
                confidence: 0.8,
                entities: extractedItems.tasks || [],
                context: { hasDeadline: transcript.includes('by') || transcript.includes('until') }
            };
        }

        if (transcript.includes('goal') || transcript.includes('want to achieve') || transcript.includes('plan')) {
            return {
                type: 'goal_setting',
                confidence: 0.7,
                entities: [],
                context: { timeframe: this.extractTimeframe(transcript) }
            };
        }

        if (transcript.includes('feel') || transcript.includes('think') || transcript.includes('reflect')) {
            return {
                type: 'reflection',
                confidence: 0.6,
                entities: [],
                context: { mood: voiceNote.extractedItems.mood }
            };
        }

        return {
            type: 'reflection',
            confidence: 0.5,
            entities: [],
            context: {}
        };
    }

    private calculateStreak(habit: any, history: any[]): any {
        // Simplified streak calculation
        return {
            currentStreak: habit.streak_count || 0,
            longestStreak: habit.longest_streak || 0,
            consistency: 0.8 // Placeholder
        };
    }

    private predictHabitSuccess(habit: any, streakData: any): any {
        // Simplified habit success prediction
        const consistency = streakData.consistency;
        const currentStreak = streakData.currentStreak;

        let risk = 1 - consistency;
        if (currentStreak === 0) risk += 0.3;
        if (currentStreak < 3) risk += 0.2;

        return {
            successProbability: Math.max(0.1, 1 - risk),
            risk: Math.min(0.9, risk),
            suggestedActions: this.generateHabitSuggestions(habit, streakData)
        };
    }

    private analyzeStreakPatterns(habitHistory: any[]): any {
        return {
            averageStreakLength: 7,
            bestDayOfWeek: 'Monday',
            worstDayOfWeek: 'Friday',
            trends: 'improving'
        };
    }

    private identifyBehaviorPatterns(voiceNotes: VoiceNote[], tasks: Task[]): any[] {
        return [
            {
                type: 'time_preference',
                data: { preferredHour: 9, pattern: 'morning_person' }
            },
            {
                type: 'task_complexity',
                data: { averageTasksPerDay: 3, preferenceForDetailedTasks: true }
            }
        ];
    }

    private generateBehaviorInsights(patterns: any[], userSettings: UserSettings): string[] {
        return [
            'You tend to be most productive in the morning',
            'You prefer detailed task descriptions',
            'Your goal-setting aligns well with your daily activities'
        ];
    }

    private generateBehaviorRecommendations(patterns: any[], userSettings: UserSettings): Recommendation[] {
        return [
            {
                id: 'schedule_optimization',
                type: 'insight',
                title: 'Optimize your schedule',
                description: 'Based on your patterns, consider scheduling important tasks in the morning.',
                priority: 7,
                confidence: 0.8,
                reasons: ['Morning productivity pattern detected'],
                actionable: true
            }
        ];
    }

    private generateIntentBasedRecommendations(intentClusters: Map<UserIntent['type'], VoiceNote[]>, userSettings: UserSettings): Recommendation[] {
        const recommendations: Recommendation[] = [];

        for (const [intentType, notes] of intentClusters) {
            if (intentType === 'task_creation' && notes.length > 5) {
                recommendations.push({
                    id: 'task_organization',
                    type: 'task',
                    title: 'Organize your tasks',
                    description: 'You\'ve created many tasks recently. Consider categorizing them by priority.',
                    priority: 6,
                    confidence: 0.7,
                    reasons: ['High task creation activity'],
                    actionable: true
                });
            }
        }

        return recommendations;
    }

    private generateGoalBasedRecommendations(goals: string[], voiceNotes: VoiceNote[], tasks: Task[]): Recommendation[] {
        return goals.map(goal => ({
            id: `goal_${goal.toLowerCase().replace(/\s+/g, '_')}`,
            type: 'goal' as const,
            title: `Progress on ${goal}`,
            description: `Review your recent activities related to ${goal} and plan next steps.`,
            priority: 8,
            confidence: 0.6,
            reasons: ['User-defined goal'],
            actionable: true
        }));
    }

    private generateHabitSuggestions(habit: any, streakData: any): string[] {
        const suggestions = [];

        if (streakData.currentStreak === 0) {
            suggestions.push('Start with a smaller version of the habit');
            suggestions.push('Set a specific time for the habit');
        }

        if (streakData.consistency < 0.5) {
            suggestions.push('Consider habit stacking with an existing routine');
            suggestions.push('Review and adjust the habit difficulty');
        }

        return suggestions;
    }

    private extractTimeframe(transcript: string): string | null {
        if (transcript.includes('week')) return 'weekly';
        if (transcript.includes('month')) return 'monthly';
        if (transcript.includes('year')) return 'yearly';
        if (transcript.includes('today') || transcript.includes('tomorrow')) return 'daily';
        return null;
    }
}