import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from '../enums/subscription.enums';

export class UpdateSubscriptionDto {
    @ApiPropertyOptional({
        description: 'New subscription plan',
        enum: SubscriptionPlan
    })
    @IsOptional()
    @IsEnum(SubscriptionPlan)
    plan?: SubscriptionPlan;

    @ApiPropertyOptional({
        description: 'Auto-renew setting',
        example: true
    })
    @IsOptional()
    autoRenew?: boolean;
}

export class CancelSubscriptionDto {
    @ApiPropertyOptional({
        description: 'Reason for cancellation',
        example: 'Too expensive'
    })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({
        description: 'Cancel immediately or at period end',
        example: false
    })
    @IsOptional()
    immediately?: boolean;
}