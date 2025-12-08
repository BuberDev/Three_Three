import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings extends BaseEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @Column({ default: false })
    consentVoiceProcessing: boolean;

    @Column({ default: false })
    consentPersonalization: boolean;

    @Column({ type: 'jsonb', default: [] })
    primaryGoals: string[];

    @Column({ type: 'jsonb', default: {} })
    preferences: Record<string, any>;

    @Column({ nullable: true, length: 10 })
    timezone?: string;

    @Column({ nullable: true, length: 5 })
    language?: string;

    @Column({ default: true })
    notificationsEnabled: boolean;

    @Column({ default: true })
    emailNotifications: boolean;

    @Column({ default: false })
    pushNotifications: boolean;

    // Relations
    @OneToOne(() => User, (user) => user.settings, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;
}