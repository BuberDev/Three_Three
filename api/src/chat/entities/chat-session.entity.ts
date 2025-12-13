import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

export enum ChatSessionType {
    GENERAL = 'general',
    TASK_ASSISTANCE = 'task_assistance',
    ANALYTICS = 'analytics',
    PERSONAL = 'personal',
    VOICE_ANALYSIS = 'voice_analysis'
}

export enum ChatSessionStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
    DELETED = 'deleted'
}

@Entity('chat_sessions')
@Index(['userId', 'createdAt'])
@Index(['userId', 'status'])
export class ChatSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @Column('uuid')
    userId: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({
        type: 'enum',
        enum: ChatSessionType,
        default: ChatSessionType.GENERAL
    })
    type: ChatSessionType;

    @Column({
        type: 'enum',
        enum: ChatSessionStatus,
        default: ChatSessionStatus.ACTIVE
    })
    status: ChatSessionStatus;

    @Column({ type: 'varchar', length: 100 })
    model: string; // AI model used

    @Column({ type: 'text', nullable: true })
    systemPrompt: string;

    @Column({ type: 'jsonb', nullable: true })
    settings: Record<string, any>; // temperature, max_tokens, etc.

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>; // custom metadata

    @Column({ type: 'int', default: 0 })
    messageCount: number;

    @Column({ type: 'int', default: 0 })
    totalTokens: number;

    @Column({ type: 'timestamp', nullable: true })
    lastMessageAt: Date;

    // Relations
    @ManyToOne(() => User, user => user.chatSessions)
    user: User;

    @OneToMany(() => ChatMessage, message => message.session, { cascade: true })
    messages: ChatMessage[];
}