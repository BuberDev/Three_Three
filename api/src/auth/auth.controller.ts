import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AuthResponse, AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { GoogleMobileAuthDto } from './dto/google-mobile-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered',
        type: Object,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Validation failed',
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict - User already exists',
    })
    async register(@Body() createUserDto: CreateUserDto): Promise<AuthResponse> {
        return this.authService.register(createUserDto);
    }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 200,
        description: 'User successfully logged in',
        type: Object,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid credentials',
    })
    async login(
        @Body() loginDto: LoginDto,
        @Request() req: any,
    ): Promise<AuthResponse> {
        return this.authService.login(loginDto);
    }

    @Public()
    @Post('google/mobile')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Authenticate native mobile Google sign-in' })
    @ApiBody({ type: GoogleMobileAuthDto })
    @ApiResponse({
        status: 200,
        description: 'Google user authenticated successfully',
        type: Object,
    })
    async googleMobile(
        @Body() googleMobileAuthDto: GoogleMobileAuthDto,
    ): Promise<AuthResponse> {
        return this.authService.authenticateGoogleMobile(googleMobileAuthDto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
        status: 200,
        description: 'Token successfully refreshed',
        type: Object,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid refresh token',
    })
    async refresh(
        @Body() refreshTokenDto: RefreshTokenDto,
    ): Promise<AuthResponse> {
        return this.authService.refreshTokens(refreshTokenDto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({
        status: 204,
        description: 'User successfully logged out',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid token',
    })
    async logout(@CurrentUser() user: User): Promise<void> {
        return this.authService.logout(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
    })
    async getProfile(@CurrentUser() user: User): Promise<User> {
        return user;
    }

    // Google OAuth endpoints
    @Public()
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Initiate Google OAuth flow' })
    @ApiResponse({
        status: 302,
        description: 'Redirects to Google OAuth consent page',
    })
    async googleAuth(@Request() req: any): Promise<void> {
        // This will trigger the Google OAuth flow
    }

    @Public()
    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiResponse({
        status: 302,
        description: 'Handles Google OAuth callback and redirects with tokens',
    })
    async googleAuthRedirect(
        @Request() req: any,
        @Res() res: Response,
    ): Promise<void> {
        try {
            const user = req.user as User;
            const tokens = await this.authService.generateTokensForUser(user);

            // Redirect to frontend with tokens
            const redirectUrl = `${process.env.FRONTEND_URL || 'exp://localhost:8081'}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`;
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'exp://localhost:8081'}/auth/error`);
        }
    }
}
