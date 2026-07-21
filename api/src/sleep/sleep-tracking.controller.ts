import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateSleepTrackingDto } from './dto/create-sleep-tracking.dto';
import { ProcessSleepAudioDto } from './dto/process-sleep-audio.dto';
import { UpdateSleepTrackingDto } from './dto/update-sleep-tracking.dto';
import { SleepTracking } from './entities/sleep-tracking.entity';
import { SleepTrackingService } from './sleep-tracking.service';

@ApiTags('Sleep Tracking')
@Controller('sleep-tracking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SleepTrackingController {
    constructor(private readonly sleepTrackingService: SleepTrackingService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new sleep record' })
    @ApiResponse({
        status: 201,
        description: 'Sleep record created successfully',
        type: SleepTracking,
    })
    create(
        @CurrentUser() user: User,
        @Body() createSleepTrackingDto: CreateSleepTrackingDto,
    ): Promise<SleepTracking> {
        return this.sleepTrackingService.create(user.id, createSleepTrackingDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all sleep records for current user' })
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
        description: 'List of sleep records retrieved successfully',
        type: [SleepTracking],
    })
    findAll(
        @CurrentUser() user: User,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<SleepTracking[]> {
        const options = {
            take: limit ? parseInt(limit, 10) : undefined,
            skip: offset ? parseInt(offset, 10) : undefined,
        };
        return this.sleepTrackingService.findAll(user.id, options);
    }

    @Get('latest')
    @ApiOperation({ summary: 'Get latest sleep record' })
    @ApiResponse({
        status: 200,
        description: 'Latest sleep record retrieved successfully',
        type: SleepTracking,
    })
    findLatest(@CurrentUser() user: User): Promise<SleepTracking | null> {
        return this.sleepTrackingService.findLatest(user.id);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get sleep statistics' })
    @ApiQuery({
        name: 'days',
        required: false,
        type: Number,
        description: 'Number of days to analyze (default: 30)',
    })
    @ApiResponse({
        status: 200,
        description: 'Sleep statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                averageDuration: { type: 'number' },
                averageQuality: { type: 'number' },
                averageEfficiency: { type: 'number' },
                snoringNights: { type: 'number' },
                sleepTalkingNights: { type: 'number' },
                totalRecords: { type: 'number' },
            },
        },
    })
    getStats(
        @CurrentUser() user: User,
        @Query('days') days?: string,
    ) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.sleepTrackingService.getSleepStats(user.id, daysNumber);
    }

    @Get('date-range')
    @ApiOperation({ summary: 'Get sleep records by date range' })
    @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (ISO string)' })
    @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO string)' })
    @ApiResponse({
        status: 200,
        description: 'Sleep records in date range retrieved successfully',
        type: [SleepTracking],
    })
    findByDateRange(
        @CurrentUser() user: User,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ): Promise<SleepTracking[]> {
        return this.sleepTrackingService.findByDateRange(
            user.id,
            new Date(startDate),
            new Date(endDate),
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get sleep record by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Sleep record retrieved successfully',
        type: SleepTracking,
    })
    @ApiResponse({
        status: 404,
        description: 'Sleep record not found',
    })
    findOne(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SleepTracking> {
        return this.sleepTrackingService.findById(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update sleep record' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Sleep record updated successfully',
        type: SleepTracking,
    })
    @ApiResponse({
        status: 404,
        description: 'Sleep record not found',
    })
    update(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateSleepTrackingDto: UpdateSleepTrackingDto,
    ): Promise<SleepTracking> {
        return this.sleepTrackingService.update(id, user.id, updateSleepTrackingDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete sleep record' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 204,
        description: 'Sleep record deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Sleep record not found',
    })
    remove(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        return this.sleepTrackingService.remove(id, user.id);
    }

    @Get(':id/insights')
    @ApiOperation({ summary: 'Get AI-powered sleep insights and correlations' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Sleep tracking record ID' })
    @ApiResponse({
        status: 200,
        description: 'Sleep insights generated successfully',
        schema: {
            type: 'object',
            properties: {
                sleepTrackingId: { type: 'string' },
                date: { type: 'string' },
                correlations: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', enum: ['diet', 'mood', 'activity', 'stress', 'environment'] },
                            correlation: { type: 'string' },
                            confidence: { type: 'number' },
                            evidence: { type: 'array', items: { type: 'string' } },
                            recommendation: { type: 'string' },
                        },
                    },
                },
                overallInsight: { type: 'string' },
                actionableAdvice: { type: 'array', items: { type: 'string' } },
                trendAnalysis: { type: 'string' },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Sleep record not found',
    })
    async getSleepInsights(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.sleepTrackingService.getSleepInsights(user.id, id);
    }

    @Post('process-audio')
    @UseInterceptors(
        FileInterceptor('audio', {
            limits: {
                fileSize: 1024 * 1024 * 1024, // 1GB — a full night can run large at even modest bitrates
            },
            fileFilter: (req, file, cb) => {
                const allowedMimeTypes = [
                    'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aac',
                    'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/flac',
                    'audio/ogg', 'audio/webm', 'application/octet-stream',
                ];
                if (allowedMimeTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException('Invalid audio file format'), false);
                }
            },
        }),
    )
    @ApiOperation({ summary: 'Upload a nocturnal audio recording for AI analysis' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                audio: { type: 'string', format: 'binary' },
                bedtime: { type: 'string' },
                wakeTime: { type: 'string' },
            },
            required: ['audio', 'bedtime', 'wakeTime'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Recording accepted and queued for analysis (processingStatus: pending)',
        type: SleepTracking,
    })
    async processAudio(
        @CurrentUser() user: User,
        @Body() processAudioDto: ProcessSleepAudioDto,
        @UploadedFile() audioFile: Express.Multer.File,
    ): Promise<SleepTracking> {
        if (!audioFile) {
            throw new BadRequestException('Audio file is required');
        }
        return this.sleepTrackingService.createPendingRecordAndQueue(
            user.id,
            audioFile,
            processAudioDto.bedtime,
            processAudioDto.wakeTime,
        );
    }
}