import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthProvider, User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { GoogleMobileAuthDto } from './dto/google-mobile-auth.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
    sub: string;
    email: string;
    authProvider: AuthProvider;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
        const existingUser = await this.usersService.findByEmail(createUserDto.email);

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        if (!createUserDto.password || createUserDto.password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters long');
        }

        const hashedPassword = await this.hashPassword(createUserDto.password);

        const user = await this.usersService.create({
            ...createUserDto,
            password: hashedPassword,
            authProvider: AuthProvider.LOCAL,
        });

        // Auto-start 7-day trial for new users
        try {
            await this.subscriptionsService.startTrial(user.id);
        } catch (error) {
            // Log error but don't fail registration
            console.error('Failed to start trial for new user:', error);
        }

        return this.generateTokens(user);
    }

    async login(loginDto: LoginDto): Promise<AuthResponse> {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.usersService.updateLastLogin(user.id);

        return this.generateTokens(user);
    }

    async authenticateGoogleMobile(googleMobileAuthDto: GoogleMobileAuthDto): Promise<AuthResponse> {
        const audiences = [
            this.configService.get<string>('app.google.clientId'),
            process.env.GOOGLE_CLIENT_ID_WEB,
            process.env.GOOGLE_CLIENT_ID_IOS,
            process.env.GOOGLE_CLIENT_ID_ANDROID,
        ].filter((value, index, list): value is string =>
            Boolean(value) && list.indexOf(value) === index,
        );

        if (audiences.length === 0) {
            throw new BadRequestException('Google OAuth client ID is not configured');
        }

        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken: googleMobileAuthDto.idToken,
            audience: audiences,
        });
        const payload = ticket.getPayload();

        if (!payload?.email || !payload.sub) {
            throw new UnauthorizedException('Invalid Google token payload');
        }

        const email = payload.email.toLowerCase();
        let user = await this.usersService.findByEmailAndProvider(email, AuthProvider.GOOGLE);
        let isNewUser = false;

        if (!user) {
            const existingUser = await this.usersService.findByEmail(email);
            if (existingUser) {
                throw new ConflictException('User with this email already exists. Please log in with email instead.');
            }

            user = await this.usersService.create({
                email,
                firstName: payload.given_name,
                lastName: payload.family_name,
                authProvider: AuthProvider.GOOGLE,
                externalId: payload.sub,
            });
            user = await this.usersService.update(user.id, {
                isEmailVerified: payload.email_verified ?? true,
            });
            isNewUser = true;
        } else {
            user = await this.usersService.update(user.id, {
                firstName: payload.given_name,
                lastName: payload.family_name,
                externalId: payload.sub,
                isEmailVerified: payload.email_verified ?? user.isEmailVerified,
            });
        }

        await this.usersService.updateSettings(user.id, {
            consentVoiceProcessing: googleMobileAuthDto.consentVoiceProcessing,
            consentPersonalization: googleMobileAuthDto.consentPersonalization,
            primaryGoals: googleMobileAuthDto.primaryGoals,
            timezone: googleMobileAuthDto.timezone,
            language: googleMobileAuthDto.language,
        });

        if (isNewUser) {
            try {
                await this.subscriptionsService.startTrial(user.id);
            } catch (error) {
                console.error('Failed to start trial for Google user:', error);
            }
        }

        await this.usersService.updateLastLogin(user.id);

        return this.generateTokens(user);
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.usersService.findByEmail(email);

        if (!user || !user.password) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        return user;
    }

    async refreshTokens(refreshToken: string): Promise<AuthResponse> {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.usersService.findById(payload.sub);

            if (!user || user.refreshToken !== refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            return this.generateTokens(user);
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string): Promise<void> {
        await this.usersService.clearRefreshToken(userId);
    }

    private async generateTokens(user: User): Promise<AuthResponse> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            authProvider: user.authProvider,
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '30d',
        });

        // Store refresh token
        await this.usersService.updateRefreshToken(user.id, refreshToken);

        return {
            user,
            accessToken,
            refreshToken,
        };
    }

    private async hashPassword(password: string): Promise<string> {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    }

    async validateJwtPayload(payload: JwtPayload): Promise<User> {
        const user = await this.usersService.findById(payload.sub);

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        return user;
    }

    /**
     * Generate tokens for OAuth user (used by Google/Apple auth)
     */
    async generateTokensForUser(user: User): Promise<AuthResponse> {
        return this.generateTokens(user);
    }
}
