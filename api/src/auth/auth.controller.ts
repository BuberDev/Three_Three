import {
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AuthResponse, AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
}