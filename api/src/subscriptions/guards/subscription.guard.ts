import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionFeature } from '../enums/subscription.enums';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private subscriptionsService: SubscriptionsService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredFeature = this.reflector.get<SubscriptionFeature>(
            'subscription-feature',
            context.getHandler()
        );

        if (!requiredFeature) {
            return true; // No subscription requirement
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return false; // User not authenticated
        }

        return this.subscriptionsService.hasFeatureAccess(user.id, requiredFeature);
    }
}