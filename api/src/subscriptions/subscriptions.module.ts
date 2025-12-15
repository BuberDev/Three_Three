import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionPlanConfig } from './entities/subscription-plan-config.entity';
import { SubscriptionTransaction } from './entities/subscription-transaction.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionGuard } from './guards/subscription.guard';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Subscription,
            SubscriptionPlanConfig,
            SubscriptionTransaction,
        ]),
        UsersModule,
        PaymentsModule,
    ],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, SubscriptionGuard],
    exports: [SubscriptionsService, SubscriptionGuard],
})
export class SubscriptionsModule { }