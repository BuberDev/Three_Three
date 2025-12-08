import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSettings } from './entities/user-settings.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({
        status: 201,
        description: 'User successfully created',
        type: User,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Validation failed',
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict - User already exists',
    })
    create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({
        status: 200,
        description: 'List of users retrieved successfully',
        type: [User],
    })
    findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: 200,
        description: 'Current user profile retrieved successfully',
        type: User,
    })
    getMe(@CurrentUser() user: User): User {
        return user;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'User retrieved successfully',
        type: User,
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
        return this.usersService.findById(id);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile updated successfully',
        type: User,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Validation failed',
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict - Email already in use',
    })
    updateMe(
        @CurrentUser() user: User,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<User> {
        return this.usersService.update(user.id, updateUserDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update user by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'User updated successfully',
        type: User,
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict - Email already in use',
    })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<User> {
        return this.usersService.update(id, updateUserDto);
    }

    @Patch('me/settings')
    @ApiOperation({ summary: 'Update current user settings' })
    @ApiResponse({
        status: 200,
        description: 'User settings updated successfully',
        type: UserSettings,
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    updateMySettings(
        @CurrentUser() user: User,
        @Body() updateSettingsDto: UpdateUserSettingsDto,
    ): Promise<UserSettings> {
        return this.usersService.updateSettings(user.id, updateSettingsDto);
    }

    @Post('me/complete-onboarding')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark onboarding as completed' })
    @ApiResponse({
        status: 200,
        description: 'Onboarding marked as completed',
        type: User,
    })
    completeOnboarding(@CurrentUser() user: User): Promise<User> {
        return this.usersService.markOnboardingCompleted(user.id);
    }

    @Delete('me')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Deactivate current user account' })
    @ApiResponse({
        status: 204,
        description: 'User account deactivated successfully',
    })
    deactivateMe(@CurrentUser() user: User): Promise<User> {
        return this.usersService.deactivate(user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete user by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 204,
        description: 'User deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.usersService.remove(id);
    }
}