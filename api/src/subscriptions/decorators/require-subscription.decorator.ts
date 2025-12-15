import { SetMetadata } from '@nestjs/common';
import { SubscriptionFeature } from '../enums/subscription.enums';

export const RequireSubscription = (feature: SubscriptionFeature) =>
    SetMetadata('subscription-feature', feature);