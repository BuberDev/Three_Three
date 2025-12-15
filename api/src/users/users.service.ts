import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSettings } from './entities/user-settings.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserSettings)
        private readonly userSettingsRepository: Repository<UserSettings>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.findByEmail(createUserDto.email);

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const user = this.userRepository.create(createUserDto);
        const savedUser = await this.userRepository.save(user);

        // Create default user settings
        const settings = this.userSettingsRepository.create({
            userId: savedUser.id,
            preferences: {},
            primaryGoals: [],
        });
        await this.userSettingsRepository.save(settings);

        return savedUser;
    }

    async findAll(options?: FindManyOptions<User>): Promise<User[]> {
        return this.userRepository.find({
            relations: ['settings'],
            ...options,
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id },
            relations: ['settings'],
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email },
            relations: ['settings'],
        });
    }

    async findByEmailAndProvider(email: string, authProvider: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: {
                email,
                authProvider: authProvider as any
            },
            relations: ['settings'],
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check for email conflicts
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.findByEmail(updateUserDto.email);
            if (existingUser) {
                throw new ConflictException('Email already in use');
            }
        }

        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }

    async updateSettings(
        userId: string,
        updateSettingsDto: UpdateUserSettingsDto,
    ): Promise<UserSettings> {
        const user = await this.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        let settings = await this.userSettingsRepository.findOne({
            where: { userId },
        });

        if (!settings) {
            settings = this.userSettingsRepository.create({
                userId,
                ...updateSettingsDto,
            });
        } else {
            Object.assign(settings, updateSettingsDto);
        }

        return this.userSettingsRepository.save(settings);
    }

    async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
        await this.userRepository.update(id, { refreshToken });
    }

    async clearRefreshToken(id: string): Promise<void> {
        await this.userRepository.update(id, { refreshToken: null });
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.userRepository.update(id, { lastLoginAt: new Date() });
    }

    async markOnboardingCompleted(id: string): Promise<User> {
        const user = await this.findById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.isOnboardingCompleted = true;
        return this.userRepository.save(user);
    }

    async deactivate(id: string): Promise<User> {
        const user = await this.findById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.isActive = false;
        user.refreshToken = null;
        return this.userRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const user = await this.findById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.userRepository.softDelete(id);
    }

    async findByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: {
                metadata: {
                    stripeCustomerId
                } as any
            }
        });
    }
}