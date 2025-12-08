import { Exclude } from 'class-transformer';
import {
    Column,
    Entity,
    Index,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Event } from '../../events/entities/event.entity';
import { Task } from '../../tasks/entities/task.entity';
import { VoiceNote } from '../../voice-notes/entities/voice-note.entity';
import { UserSettings } from './user-settings.entity';

export enum AuthProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
    APPLE = 'apple',
}

@Entity('users')
@Index(['email', 'authProvider'], { unique: true })
export class User extends BaseEntity {
    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ nullable: true })
    @Exclude({ toPlainOnly: true })
    password?: string;

    @Column({
        type: 'enum',
        enum: AuthProvider,
        default: AuthProvider.LOCAL,
    })
    authProvider: AuthProvider;

    @Column({ nullable: true, length: 255 })
    externalId?: string;

    @Column({ nullable: true, length: 100 })
    firstName?: string;

    @Column({ nullable: true, length: 100 })
    lastName?: string;

    @Column({ default: false })
    isEmailVerified: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isOnboardingCompleted: boolean;

    @Column({ nullable: true })
    @Exclude({ toPlainOnly: true })
    refreshToken?: string;

    @Column({ nullable: true })
    lastLoginAt?: Date;

    // Relations
    @OneToOne(() => UserSettings, (settings) => settings.user, {
        cascade: true,
        eager: false,
    })
    settings: UserSettings;

    @OneToMany(() => VoiceNote, (voiceNote) => voiceNote.user)
    voiceNotes: VoiceNote[];

    @OneToMany(() => Task, (task) => task.user)
    tasks: Task[];

    @OneToMany(() => Event, (event) => event.user)
    events: Event[];

    // Virtual properties
    get fullName(): string {
        return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }
}