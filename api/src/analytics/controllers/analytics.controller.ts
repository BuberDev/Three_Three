import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AIInsight, InsightCategory, InsightType } from '../entities/ai-insight.entity';
import { AnalyticsData, AnalyticsService } from '../services/analytics.service';
import { CorrelationDiscoveryResult, CorrelationService } from '../services/correlation.service';
import { InsightDashboard, InsightService } from '../services/insight.service';
import { PatternDiscoveryResult, PatternService } from '../services/pattern.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly correlationService: CorrelationService,
        private readonly patternService: PatternService,
        private readonly insightService: InsightService,
    ) { }

    @Get('daily/:date')
    @ApiOperation({ summary: 'Get daily analytics for a specific date' })
    @ApiResponse({ status: 200, description: 'Daily analytics retrieved successfully' })
    async getDailyAnalytics(
        @CurrentUser() user: any,
        @Param('date') date: string,
    ): Promise<AnalyticsData> {
        return this.analyticsService.getDailyAnalytics(user.id, date);
    }

    @Get('weekly')
    @ApiOperation({ summary: 'Get weekly analytics summary' })
    @ApiResponse({ status: 200, description: 'Weekly analytics retrieved successfully' })
    async getWeeklyAnalytics(
        @CurrentUser() user: any,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ): Promise<{
        summary: {
            avgEnergy: number | null;
            avgMood: number | null;
            avgProductivity: number | null;
            avgSleepHours: number | null;
            avgSleepQuality: number | null;
            totalActivities: number;
            totalJournalEntries: number;
            totalVoiceNotes: number;
        };
        trends: Array<{
            date: string;
            metrics: AnalyticsData['metrics'];
            activities: number;
            sleepHours: number | null;
        }>;
    }> {
        return this.analyticsService.getWeeklyAnalytics(user.id, startDate, endDate);
    }

    @Post('calculate/:date')
    @ApiOperation({ summary: 'Calculate performance metrics for a specific date' })
    @ApiResponse({ status: 200, description: 'Performance metrics calculated successfully' })
    @HttpCode(HttpStatus.OK)
    async calculatePerformanceMetrics(
        @CurrentUser() user: any,
        @Param('date') date: string,
    ): Promise<{ success: boolean; message: string }> {
        await this.analyticsService.calculatePerformanceMetrics(user.id, date);
        return {
            success: true,
            message: `Performance metrics calculated for ${date}`,
        };
    }

    @Get('correlations')
    @ApiOperation({ summary: 'Get discovered correlations' })
    @ApiResponse({ status: 200, description: 'Correlations retrieved successfully' })
    async getCorrelations(
        @CurrentUser() user: any,
        @Query('timeRange', ParseIntPipe) timeRange: number = 90,
    ): Promise<CorrelationDiscoveryResult> {
        return this.correlationService.discoverCorrelations(user.id, timeRange);
    }

    @Post('correlations/discover')
    @ApiOperation({ summary: 'Trigger correlation discovery' })
    @ApiResponse({ status: 200, description: 'Correlation discovery completed' })
    async discoverCorrelations(
        @CurrentUser() user: any,
        @Body() body: { timeRangeInDays?: number },
    ): Promise<CorrelationDiscoveryResult> {
        return this.correlationService.discoverCorrelations(user.id, body.timeRangeInDays || 90);
    }

    @Get('patterns')
    @ApiOperation({ summary: 'Get discovered behavioral patterns' })
    @ApiResponse({ status: 200, description: 'Patterns retrieved successfully' })
    async getPatterns(
        @CurrentUser() user: any,
        @Query('timeRange', ParseIntPipe) timeRange: number = 90,
    ): Promise<PatternDiscoveryResult> {
        return this.patternService.discoverPatterns(user.id, timeRange);
    }

    @Post('patterns/discover')
    @ApiOperation({ summary: 'Trigger pattern discovery' })
    @ApiResponse({ status: 200, description: 'Pattern discovery completed' })
    async discoverPatterns(
        @CurrentUser() user: any,
        @Body() body: { timeRangeInDays?: number },
    ): Promise<PatternDiscoveryResult> {
        return this.patternService.discoverPatterns(user.id, body.timeRangeInDays || 90);
    }

    @Get('insights')
    @ApiOperation({ summary: 'Get AI-generated insights' })
    @ApiResponse({ status: 200, description: 'Insights retrieved successfully' })
    async getInsights(
        @CurrentUser() user: any,
        @Query('limit', ParseIntPipe) limit: number = 20,
    ): Promise<AIInsight[]> {
        return this.insightService.getUserInsights(user.id, limit);
    }

    @Post('insights/generate')
    @ApiOperation({ summary: 'Generate new AI insights' })
    @ApiResponse({ status: 200, description: 'Insights generated successfully' })
    async generateInsights(
        @CurrentUser() user: any,
        @Body() options: {
            includeTypes?: InsightType[];
            categories?: InsightCategory[];
            minConfidence?: number;
            maxInsights?: number;
            timeRangeInDays?: number;
        },
    ): Promise<AIInsight[]> {
        return this.insightService.generateInsights(user.id, options);
    }

    @Get('insights/dashboard')
    @ApiOperation({ summary: 'Get insights dashboard summary' })
    @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
    async getInsightDashboard(
        @CurrentUser() user: any,
    ): Promise<InsightDashboard> {
        return this.insightService.getInsightDashboard(user.id);
    }

    @Patch('insights/:id/seen')
    @ApiOperation({ summary: 'Mark insight as seen' })
    @ApiResponse({ status: 200, description: 'Insight marked as seen' })
    async markInsightAsSeen(
        @Param('id') insightId: string,
    ): Promise<{ success: boolean }> {
        await this.insightService.markInsightAsSeen(insightId);
        return { success: true };
    }

    @Patch('insights/:id/feedback')
    @ApiOperation({ summary: 'Add feedback to insight' })
    @ApiResponse({ status: 200, description: 'Feedback added successfully' })
    async addInsightFeedback(
        @Param('id') insightId: string,
        @Body() body: { rating: number; feedback?: string },
    ): Promise<{ success: boolean }> {
        await this.insightService.addInsightFeedback(insightId, body.rating, body.feedback);
        return { success: true };
    }

    @Patch('insights/:id/dismiss')
    @ApiOperation({ summary: 'Dismiss insight' })
    @ApiResponse({ status: 200, description: 'Insight dismissed successfully' })
    async dismissInsight(
        @Param('id') insightId: string,
        @Body() body: { reason?: string },
    ): Promise<{ success: boolean }> {
        await this.insightService.dismissInsight(insightId, body.reason);
        return { success: true };
    }

    @Post('full-analysis')
    @ApiOperation({
        summary: 'Run complete analysis pipeline',
        description: 'Runs performance calculation, correlation discovery, pattern recognition, and insight generation'
    })
    @ApiResponse({ status: 200, description: 'Complete analysis finished successfully' })
    async runFullAnalysis(
        @CurrentUser() user: any,
        @Body() options: {
            timeRangeInDays?: number;
            calculateMetrics?: boolean;
            generateInsights?: boolean;
        } = {},
    ): Promise<{
        success: boolean;
        results: {
            metricsCalculated?: boolean;
            correlationsFound?: number;
            patternsFound?: number;
            insightsGenerated?: number;
        };
    }> {
        const {
            timeRangeInDays = 90,
            calculateMetrics = true,
            generateInsights = true,
        } = options;

        const results: {
            metricsCalculated?: boolean;
            correlationsFound?: number;
            patternsFound?: number;
            insightsGenerated?: number;
        } = {};

        // Calculate recent metrics if requested
        if (calculateMetrics) {
            const today = new Date().toISOString().split('T')[0];
            await this.analyticsService.calculatePerformanceMetrics(user.id, today);
            results.metricsCalculated = true;
        }

        // Discover correlations
        const correlationResults = await this.correlationService.discoverCorrelations(user.id, timeRangeInDays);
        results.correlationsFound = correlationResults.correlations.length;

        // Discover patterns
        const patternResults = await this.patternService.discoverPatterns(user.id, timeRangeInDays);
        results.patternsFound = patternResults.patterns.length;

        // Generate insights if requested
        if (generateInsights) {
            const insights = await this.insightService.generateInsights(user.id, {
                timeRangeInDays,
                maxInsights: 30,
                minConfidence: 0.5,
            });
            results.insightsGenerated = insights.length;
        }

        return {
            success: true,
            results,
        };
    }
}