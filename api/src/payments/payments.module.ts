import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        forwardRef(() => SubscriptionsModule),
    ],
    controllers: [PaymentsController],
    providers: [StripeService, PaymentsService],
    exports: [StripeService, PaymentsService],
})
export class PaymentsModule { }