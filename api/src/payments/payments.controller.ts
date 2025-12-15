import {
    Body,
    Controller,
    Headers,
    HttpCode,
    HttpStatus,
    Post,
    RawBodyRequest,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly paymentsService: PaymentsService,
    ) { }

    @Post('stripe/setup-intent')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create setup intent for saving payment method' })
    @ApiResponse({
        status: 201,
        description: 'Setup intent created successfully',
    })
    async createSetupIntent(@CurrentUser() user: User) {
        return this.paymentsService.createSetupIntent(user.id);
    }

    @Post('stripe/payment-methods')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get customer payment methods' })
    @ApiResponse({
        status: 200,
        description: 'Payment methods retrieved successfully',
    })
    async getPaymentMethods(@CurrentUser() user: User) {
        return this.paymentsService.getPaymentMethods(user.id);
    }

    @Post('stripe/attach-payment-method')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Attach payment method to customer' })
    @ApiResponse({
        status: 200,
        description: 'Payment method attached successfully',
    })
    async attachPaymentMethod(
        @CurrentUser() user: User,
        @Body() body: { paymentMethodId: string }
    ) {
        return this.paymentsService.attachPaymentMethod(user.id, body.paymentMethodId);
    }

    @Post('stripe/webhooks')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Stripe webhooks' })
    @ApiResponse({
        status: 200,
        description: 'Webhook processed successfully',
    })
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        return this.paymentsService.handleStripeWebhook(req.rawBody, signature);
    }
}