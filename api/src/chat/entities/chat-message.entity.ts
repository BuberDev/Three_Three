import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatSession } from './chat-session.entity';

export enum MessageRole {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant'
}

export enum MessageStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

@Entity('chat_messages')
@Index(['sessionId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['role', 'createdAt'])
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @Column('uuid')
    sessionId: string;

    @Column('uuid')
    userId: string;

    @Column({
        type: 'enum',
        enum: MessageRole
    })
    role: MessageRole;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: MessageStatus,
        default: MessageStatus.COMPLETED
    })
    status: MessageStatus;

    @Column({ type: 'int', nullable: true })
    tokenCount: number;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>; // model info, processing time, etc.

    @Column({ type: 'float', nullable: true })
    processingTimeMs: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    model: string; // AI model used for this specific message

    @Column({ type: 'jsonb', nullable: true })
    usage: Record<string, any>; // token usage details

    @Column({ type: 'text', nullable: true })
    errorMessage: string; // if status is FAILED

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    // Relations
    @ManyToOne(() => ChatSession, session => session.messages, { onDelete: 'CASCADE' })
    session: ChatSession;

    @ManyToOne(() => User, user => user.chatMessages)
    user: User;
}