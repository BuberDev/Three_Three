import {
    Controller,
    Get,
    UseGuards
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AnalyticsService } from './analytics.service';
import { AIInsight } from './entities/ai-insight.entity';
import { BehavioralPattern } from './entities/behavioral-pattern.entity';
import { LifeCorrelation } from './entities/life-correlation.entity';
import { PerformanceMetric } from './entities/performance-metric.entity';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get comprehensive analytics dashboard' })
    @ApiResponse({
        status: 200,
        description: 'Analytics dashboard data retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                correlations: { type: 'array' },
                insights: { type: 'array' },
                performanceMetrics: { type: 'array' },
                behavioralPatterns: { type: 'array' },
            },
        },
    })
    getAnalyticsDashboard(@CurrentUser() user: User) {
        return this.analyticsService.getAnalyticsDashboard(user.id);
    }

    @Get('correlations')
    @ApiOperation({ summary: 'Get life correlations' })
    @ApiResponse({
        status: 200,
        description: 'Life correlations retrieved successfully',
        type: [LifeCorrelation],
    })
    getCorrelations(@CurrentUser() user: User): Promise<LifeCorrelation[]> {
        return this.analyticsService.discoverCorrelations(user.id);
    }

    @Get('insights')
    @ApiOperation({ summary: 'Get personalized insights' })
    @ApiResponse({
        status: 200,
        description: 'Personalized insights retrieved successfully',
        type: [AIInsight],
    })
    getInsights(@CurrentUser() user: User): Promise<AIInsight[]> {
        return this.analyticsService.generateInsights(user.id);
    }

    @Get('performance-metrics')
    @ApiOperation({ summary: 'Get performance metrics' })
    @ApiResponse({
        status: 200,
        description: 'Performance metrics retrieved successfully',
        type: [PerformanceMetric],
    })
    getPerformanceMetrics(@CurrentUser() user: User): Promise<PerformanceMetric[]> {
        return this.analyticsService.getPerformanceMetrics(user.id);
    }

    @Get('behavioral-patterns')
    @ApiOperation({ summary: 'Get behavioral patterns' })
    @ApiResponse({
        status: 200,
        description: 'Behavioral patterns retrieved successfully',
        type: [BehavioralPattern],
    })
    getBehavioralPatterns(@CurrentUser() user: User): Promise<BehavioralPattern[]> {
        return this.analyticsService.getBehavioralPatterns(user.id);
    }
}