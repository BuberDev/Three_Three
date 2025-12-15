import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionTables1703123400000 implements MigrationInterface {
    name = 'CreateSubscriptionTables1703123400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create subscription_plans table
        await queryRunner.query(`
            CREATE TABLE subscription_plans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                plan VARCHAR NOT NULL UNIQUE,
                name VARCHAR NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                currency CHAR(3) DEFAULT 'USD' NOT NULL,
                billing_period VARCHAR NOT NULL CHECK (billing_period IN ('month', 'year')),
                stripe_price_id VARCHAR,
                features TEXT[] NOT NULL,
                limits JSONB DEFAULT '{}' NOT NULL,
                is_active BOOLEAN DEFAULT true NOT NULL,
                sort_order INTEGER DEFAULT 0 NOT NULL,
                metadata JSONB DEFAULT '{}' NOT NULL
            )
        `);

        // Create subscriptions table
        await queryRunner.query(`
            CREATE TABLE subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                plan VARCHAR NOT NULL DEFAULT 'free_trial',
                status VARCHAR NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'canceled', 'expired', 'suspended')),
                trial_start_date TIMESTAMP WITH TIME ZONE,
                trial_end_date TIMESTAMP WITH TIME ZONE,
                current_period_start TIMESTAMP WITH TIME ZONE,
                current_period_end TIMESTAMP WITH TIME ZONE,
                amount DECIMAL(10,2),
                currency CHAR(3) DEFAULT 'USD',
                stripe_customer_id VARCHAR,
                stripe_subscription_id VARCHAR,
                stripe_price_id VARCHAR,
                canceled_at TIMESTAMP WITH TIME ZONE,
                cancel_reason VARCHAR,
                auto_renew BOOLEAN DEFAULT true NOT NULL,
                metadata JSONB DEFAULT '{}' NOT NULL
            )
        `);

        // Create subscription_transactions table
        await queryRunner.query(`
            CREATE TABLE subscription_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
                type VARCHAR NOT NULL CHECK (type IN ('payment', 'refund', 'chargeback', 'dispute')),
                status VARCHAR NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'canceled')),
                amount DECIMAL(10,2) NOT NULL,
                currency CHAR(3) NOT NULL,
                stripe_payment_intent_id VARCHAR,
                stripe_charge_id VARCHAR,
                failure_reason VARCHAR,
                metadata JSONB DEFAULT '{}' NOT NULL,
                processed_at TIMESTAMP WITH TIME ZONE
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status)`);
        await queryRunner.query(`CREATE INDEX idx_subscriptions_trial_end ON subscriptions(trial_end_date)`);
        await queryRunner.query(`CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end)`);
        await queryRunner.query(`CREATE INDEX idx_subscription_transactions_subscription ON subscription_transactions(subscription_id)`);
        await queryRunner.query(`CREATE INDEX idx_subscription_transactions_status ON subscription_transactions(status)`);
        await queryRunner.query(`CREATE INDEX idx_subscription_transactions_created ON subscription_transactions(created_at)`);

        // Insert default subscription plans
        await queryRunner.query(`
            INSERT INTO subscription_plans (plan, name, description, price, billing_period, features, limits, metadata, sort_order) VALUES
            ('free_trial', '7-Day Trial', 'Try all features for 7 days', 0.00, 'month', 
             ARRAY['unlimited_voice_notes', 'advanced_sleep_analysis', 'ai_insights', 'correlation_analysis'], 
             '{"voiceNotes": -1, "sleepSessions": -1, "dataRetentionDays": 7, "analyticsHistory": 1}',
             '{"trialIncluded": true}', 1),
            ('monthly_pro', 'Monthly Pro', 'Full access with monthly billing', 29.99, 'month',
             ARRAY['unlimited_voice_notes', 'advanced_sleep_analysis', 'ai_insights', 'correlation_analysis', 'behavioral_patterns', 'advanced_analytics', 'data_export', 'priority_support'],
             '{"voiceNotes": -1, "sleepSessions": -1, "dataRetentionDays": 365, "analyticsHistory": 12, "exportsPerMonth": 10}',
             '{"popularBadge": true}', 2),
            ('annual_pro', 'Annual Pro', 'Full access with annual billing (2 months free)', 299.99, 'year',
             ARRAY['unlimited_voice_notes', 'advanced_sleep_analysis', 'ai_insights', 'correlation_analysis', 'behavioral_patterns', 'advanced_analytics', 'data_export', 'priority_support', 'extended_history', 'custom_reports'],
             '{"voiceNotes": -1, "sleepSessions": -1, "dataRetentionDays": -1, "analyticsHistory": -1, "exportsPerMonth": -1}',
             '{"highlightFeature": "Best Value"}', 3)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscription_transactions_created`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscription_transactions_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscription_transactions_subscription`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_period_end`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_trial_end`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_user_status`);

        await queryRunner.query(`DROP TABLE subscription_transactions`);
        await queryRunner.query(`DROP TABLE subscriptions`);
        await queryRunner.query(`DROP TABLE subscription_plans`);
    }
}