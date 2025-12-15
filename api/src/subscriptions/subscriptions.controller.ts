import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    UseGuards,
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
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto, UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionPlanConfig } from './entities/subscription-plan-config.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsService, SubscriptionSummary } from './subscriptions.service';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Post('trial')
    @ApiOperation({ summary: 'Start 7-day free trial' })
    @ApiResponse({
        status: 201,
        description: 'Trial started successfully',
        type: Subscription,
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict - User already has subscription or used trial',
    })
    async startTrial(@CurrentUser() user: User): Promise<Subscription> {
        return this.subscriptionsService.startTrial(user.id);
    }

    @Post()
    @ApiOperation({ summary: 'Create or upgrade subscription' })
    @ApiResponse({
        status: 201,
        description: 'Subscription created successfully',
        type: Subscription,
    })
    @ApiResponse({
        status: 404,
        description: 'Plan not found',
    })
    async createSubscription(
        @CurrentUser() user: User,
        @Body() createSubscriptionDto: CreateSubscriptionDto,
    ): Promise<Subscription> {
        return this.subscriptionsService.createSubscription(
            user.id,
            createSubscriptionDto,
        );
    }

    @Get('current')
    @ApiOperation({ summary: 'Get current subscription summary' })
    @ApiResponse({
        status: 200,
        description: 'Current subscription details',
    })
    @ApiResponse({
        status: 404,
        description: 'No active subscription found',
    })
    async getCurrentSubscription(
        @CurrentUser() user: User,
    ): Promise<SubscriptionSummary | null> {
        return this.subscriptionsService.getSubscriptionSummary(user.id);
    }

    @Get('plans')
    @ApiOperation({ summary: 'Get available subscription plans' })
    @ApiResponse({
        status: 200,
        description: 'List of available plans',
        type: [SubscriptionPlanConfig],
    })
    async getAvailablePlans(): Promise<SubscriptionPlanConfig[]> {
        return this.subscriptionsService.getAvailablePlans();
    }

    @Patch('current')
    @ApiOperation({ summary: 'Update current subscription' })
    @ApiResponse({
        status: 200,
        description: 'Subscription updated successfully',
        type: Subscription,
    })
    @ApiResponse({
        status: 404,
        description: 'No active subscription found',
    })
    async updateSubscription(
        @CurrentUser() user: User,
        @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    ): Promise<Subscription> {
        return this.subscriptionsService.updateSubscription(
            user.id,
            updateSubscriptionDto,
        );
    }

    @Delete('current')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel current subscription' })
    @ApiResponse({
        status: 200,
        description: 'Subscription canceled successfully',
        type: Subscription,
    })
    @ApiResponse({
        status: 404,
        description: 'No active subscription found',
    })
    async cancelSubscription(
        @CurrentUser() user: User,
        @Body() cancelSubscriptionDto: CancelSubscriptionDto,
    ): Promise<Subscription> {
        return this.subscriptionsService.cancelSubscription(
            user.id,
            cancelSubscriptionDto,
        );
    }
}