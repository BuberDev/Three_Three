import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthProvider, User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
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
}