import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { VoiceNote } from '../../voice-notes/entities/voice-note.entity';

export enum JournalEntryType {
    DAILY_REFLECTION = 'daily_reflection',
    GOAL_SETTING = 'goal_setting',
    PROBLEM_SOLVING = 'problem_solving',
    GRATITUDE = 'gratitude',
    CHALLENGE = 'challenge',
}

@Entity('journal_entries')
@Index(['userId', 'date'])
@Index(['entryType'])
@Index(['sentimentScore'])
export class JournalEntry extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'voice_note_id', nullable: true })
    voiceNoteId?: string;

    @Column({ type: 'date' })
    date: string;

    @Column({
        name: 'entry_type',
        type: 'enum',
        enum: JournalEntryType,
    })
    entryType: JournalEntryType;

    @Column({ length: 200, nullable: true })
    title?: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'sentiment_score', type: 'float', nullable: true })
    sentimentScore?: number; // -1 to 1

    @Column({ name: 'emotional_state', type: 'jsonb', default: {} })
    emotionalState: {
        primaryEmotion?: string;
        intensity?: number; // 1-10
        secondaryEmotions?: string[];
        emotionalJourney?: Array<{
            time: string;
            emotion: string;
            intensity: number;
        }>;
    };

    @Column({ name: 'topics_mentioned', type: 'jsonb', default: [] })
    topicsMentioned: string[];

    @Column({ name: 'goals_referenced', type: 'jsonb', default: [] })
    goalsReferenced: Array<{
        goalId?: string;
        goalName: string;
        progress?: string;
        obstacles?: string[];
    }>;

    @Column({ name: 'challenges_mentioned', type: 'jsonb', default: [] })
    challengesMentioned: Array<{
        challenge: string;
        severity: number; // 1-10
        copingStrategy?: string;
        resolution?: string;
    }>;

    @Column({ name: 'insights_gained', type: 'text', nullable: true })
    insightsGained?: string;

    @Column({ name: 'action_items', type: 'jsonb', default: [] })
    actionItems: Array<{
        item: string;
        priority: 'low' | 'medium' | 'high';
        deadline?: string;
        completed?: boolean;
    }>;

    @Column({
        type: 'vector',
        nullable: true,
        comment: 'Vector embedding for semantic search',
    })
    embedding?: number[];

    // Relations
    @ManyToOne(() => User, (user) => user.journalEntries, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToOne(() => VoiceNote, { nullable: true })
    @JoinColumn({ name: 'voice_note_id' })
    voiceNote?: VoiceNote;

    // Computed properties
    get wordCount(): number {
        return this.content.split(/\s+/).filter(word => word.length > 0).length;
    }

    get emotionalIntensity(): number | null {
        return this.emotionalState.intensity || null;
    }

    get hasPositiveSentiment(): boolean {
        return (this.sentimentScore || 0) > 0.1;
    }

    get hasNegativeSentiment(): boolean {
        return (this.sentimentScore || 0) < -0.1;
    }

    get sentimentLabel(): 'positive' | 'negative' | 'neutral' {
        if (this.hasPositiveSentiment) return 'positive';
        if (this.hasNegativeSentiment) return 'negative';
        return 'neutral';
    }

    get hasActionItems(): boolean {
        return this.actionItems.length > 0;
    }

    get completedActionItems(): number {
        return this.actionItems.filter(item => item.completed).length;
    }

    get pendingActionItems(): number {
        return this.actionItems.filter(item => !item.completed).length;
    }

    // Analysis methods
    extractKeyThemes(): string[] {
        const themes: string[] = [];

        // Extract from topics mentioned
        themes.push(...this.topicsMentioned);

        // Extract from goals
        themes.push(...this.goalsReferenced.map(goal => goal.goalName));

        // Extract from challenges
        themes.push(...this.challengesMentioned.map(challenge => challenge.challenge));

        return [...new Set(themes)]; // Remove duplicates
    }

    getEmotionalSummary(): {
        primary: string;
        intensity: number;
        sentiment: string;
        complexity: number;
    } | null {
        const { primaryEmotion, intensity, secondaryEmotions } = this.emotionalState;

        if (!primaryEmotion || !intensity) return null;

        return {
            primary: primaryEmotion,
            intensity,
            sentiment: this.sentimentLabel,
            complexity: (secondaryEmotions || []).length,
        };
    }

    getCopingStrategies(): string[] {
        return this.challengesMentioned
            .map(challenge => challenge.copingStrategy)
            .filter(strategy => !!strategy) as string[];
    }

    getGoalProgress(): Array<{
        goal: string;
        progress: string;
        hasObstacles: boolean;
    }> {
        return this.goalsReferenced.map(goal => ({
            goal: goal.goalName,
            progress: goal.progress || 'Not specified',
            hasObstacles: (goal.obstacles || []).length > 0,
        }));
    }

    // Semantic search helpers
    getSimilarityScore(otherEntry: JournalEntry): number | null {
        if (!this.embedding || !otherEntry.embedding) return null;

        // Cosine similarity calculation
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < this.embedding.length; i++) {
            dotProduct += this.embedding[i] * otherEntry.embedding[i];
            normA += this.embedding[i] * this.embedding[i];
            normB += otherEntry.embedding[i] * otherEntry.embedding[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    generateInsightPrompts(): string[] {
        const prompts: string[] = [];

        if (this.hasNegativeSentiment && this.challengesMentioned.length > 0) {
            prompts.push('What coping strategies worked best for similar challenges in the past?');
        }

        if (this.goalsReferenced.length > 0) {
            prompts.push('How does today\'s progress align with your long-term goals?');
        }

        if (this.actionItems.length > 0) {
            prompts.push('Which action items will have the biggest impact on your goals?');
        }

        if (this.hasPositiveSentiment) {
            prompts.push('What factors contributed to today\'s positive experience?');
        }

        return prompts;
    }
}