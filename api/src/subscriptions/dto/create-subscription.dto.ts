import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from '../enums/subscription.enums';

export class CreateSubscriptionDto {
    @ApiProperty({
        description: 'Subscription plan type',
        enum: SubscriptionPlan,
        example: SubscriptionPlan.MONTHLY_PRO
    })
    @IsEnum(SubscriptionPlan)
    plan: SubscriptionPlan;

    @ApiPropertyOptional({
        description: 'Payment method ID from Stripe',
        example: 'pm_1234567890'
    })
    @IsOptional()
    @IsString()
    paymentMethodId?: string;

    @ApiPropertyOptional({
        description: 'Coupon or promo code',
        example: 'WELCOME25'
    })
    @IsOptional()
    @IsString()
    couponCode?: string;
}