import { Expose } from 'class-transformer';
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum ProcessingStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('voice_notes')
@Index(['userId', 'createdAt'])
@Index(['processingStatus'])
export class VoiceNote extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({ length: 500, nullable: true })
    title?: string;

    @Column('text', { nullable: true })
    transcription?: string;

    @Column('text', { nullable: true })
    summary?: string;

    @Column({ length: 255 })
    audioFilePath: string;

    @Column({ type: 'float', nullable: true })
    duration?: number;

    @Column({ type: 'bigint', nullable: true })
    fileSize?: number;

    @Column({ length: 20, default: 'audio/wav' })
    mimeType: string;

    @Column({
        type: 'enum',
        enum: ProcessingStatus,
        default: ProcessingStatus.PENDING,
    })
    processingStatus: ProcessingStatus;

    @Column({ nullable: true })
    processingStartedAt?: Date;

    @Column({ nullable: true })
    processingCompletedAt?: Date;

    @Column('text', { nullable: true })
    processingError?: string;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    extractedMetadata?: {
        mood?: string;
        topics?: string[];
        emotions?: string[];
        keywords?: string[];
        sentiment?: number;
    };

    // Vector embedding for semantic search (pgvector) - TEMPORARILY DISABLED
    // TODO: Install pgvector extension to enable this feature
    // @Column({
    //     type: 'vector',
    //     nullable: true,
    //     comment: 'Vector embedding for semantic search',
    // })
    // embedding?: number[];

    @Column({ type: 'jsonb', default: [] })
    tags: string[];

    @Column({ type: 'jsonb', default: [] })
    extractedEntities: Array<{
        type: string;
        value: string;
        confidence: number;
    }>;

    @Column({ type: 'float', nullable: true })
    sentiment?: number;

    @Column({ type: 'jsonb', default: {} })
    insights: Record<string, any>;

    // Relations
    @ManyToOne(() => User, (user) => user.voiceNotes, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // Virtual properties
    get isProcessed(): boolean {
        return this.processingStatus === ProcessingStatus.COMPLETED;
    }

    get processingDuration(): number | null {
        if (this.processingStartedAt && this.processingCompletedAt) {
            return (
                this.processingCompletedAt.getTime() -
                this.processingStartedAt.getTime()
            );
        }
        return null;
    }

    // Generate public audio URL for frontend
    @Expose()
    get audioUrl(): string | null {
        if (!this.audioFilePath) return null;

        // Extract filename from path
        const filename = this.audioFilePath.split('/').pop() || this.audioFilePath;

        // Return public URL that will be served by the backend with /api prefix
        return `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/voice-notes/audio/${filename}`;
    }
}