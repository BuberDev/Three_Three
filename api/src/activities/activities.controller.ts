import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { ActivitiesService } from './activities.service';
import { CreateDailyActivityDto } from './dto/create-daily-activity.dto';
import { UpdateDailyActivityDto } from './dto/update-daily-activity.dto';
import { DailyActivity } from './entities/daily-activity.entity';

@ApiTags('Activities')
@Controller('activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new activity' })
    @ApiResponse({
        status: 201,
        description: 'Activity created successfully',
        type: DailyActivity,
    })
    create(
        @CurrentUser() user: User,
        @Body() createActivityDto: CreateDailyActivityDto,
    ): Promise<DailyActivity> {
        return this.activitiesService.create(user.id, createActivityDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all activities for current user' })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Limit number of results',
    })
    @ApiQuery({
        name: 'offset',
        required: false,
        type: Number,
        description: 'Skip number of results',
    })
    @ApiResponse({
        status: 200,
        description: 'List of activities retrieved successfully',
        type: [DailyActivity],
    })
    findAll(
        @CurrentUser() user: User,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<DailyActivity[]> {
        const options = {
            take: limit ? parseInt(limit, 10) : undefined,
            skip: offset ? parseInt(offset, 10) : undefined,
        };
        return this.activitiesService.findAll(user.id, options);
    }

    @Get('today')
    @ApiOperation({ summary: 'Get today\'s activities' })
    @ApiResponse({
        status: 200,
        description: 'Today\'s activities retrieved successfully',
        type: [DailyActivity],
    })
    findToday(@CurrentUser() user: User): Promise<DailyActivity[]> {
        return this.activitiesService.findToday(user.id);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get activity statistics' })
    @ApiQuery({
        name: 'days',
        required: false,
        type: Number,
        description: 'Number of days to analyze (default: 30)',
    })
    @ApiResponse({
        status: 200,
        description: 'Activity statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalActivities: { type: 'number' },
                averageMood: { type: 'number' },
                averageEnergyLevel: { type: 'number' },
                averageSatisfaction: { type: 'number' },
                activityTypeBreakdown: { type: 'object' },
                topLocations: { type: 'array' },
                peopleInteractions: { type: 'number' },
            },
        },
    })
    getStats(
        @CurrentUser() user: User,
        @Query('days') days?: string,
    ) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.activitiesService.getActivityStats(user.id, daysNumber);
    }

    @Get('by-type/:type')
    @ApiOperation({ summary: 'Get activities by type' })
    @ApiParam({ name: 'type', type: 'string', description: 'Activity type' })
    @ApiResponse({
        status: 200,
        description: 'Activities by type retrieved successfully',
        type: [DailyActivity],
    })
    findByType(
        @CurrentUser() user: User,
        @Param('type') type: string,
    ): Promise<DailyActivity[]> {
        return this.activitiesService.findByType(user.id, type);
    }

    @Get('date-range')
    @ApiOperation({ summary: 'Get activities by date range' })
    @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (ISO string)' })
    @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO string)' })
    @ApiResponse({
        status: 200,
        description: 'Activities in date range retrieved successfully',
        type: [DailyActivity],
    })
    findByDateRange(
        @CurrentUser() user: User,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ): Promise<DailyActivity[]> {
        return this.activitiesService.findByDateRange(
            user.id,
            new Date(startDate),
            new Date(endDate),
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get activity by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Activity retrieved successfully',
        type: DailyActivity,
    })
    @ApiResponse({
        status: 404,
        description: 'Activity not found',
    })
    findOne(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<DailyActivity> {
        return this.activitiesService.findById(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update activity' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Activity updated successfully',
        type: DailyActivity,
    })
    @ApiResponse({
        status: 404,
        description: 'Activity not found',
    })
    update(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateActivityDto: UpdateDailyActivityDto,
    ): Promise<DailyActivity> {
        return this.activitiesService.update(id, user.id, updateActivityDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete activity' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 204,
        description: 'Activity deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Activity not found',
    })
    remove(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        return this.activitiesService.remove(id, user.id);
    }
}