import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { SubscriptionsService } from '../subscriptions.service';

interface ProcessingResult {
    processedCount: number;
    errors: Array<{
        id: string;
        error: string;
    }>;
}

@Injectable()
export class SubscriptionSchedulerService {
    private readonly logger = new Logger(SubscriptionSchedulerService.name);
    private readonly isSchedulingEnabled: boolean;

    constructor(
        private readonly subscriptionsService: SubscriptionsService,
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {
        this.isSchedulingEnabled = this.configService.get<boolean>(
            'subscription.enableScheduling',
            true
        );

        if (!this.isSchedulingEnabled) {
            this.logger.warn('Subscription scheduling is disabled via configuration');
        }
    }

    /**
     * Process expired trials daily at 2 AM UTC
     * Uses specific time to avoid high traffic periods
     */
    @Cron('0 2 * * *', {
        name: 'processExpiredTrials',
        timeZone: 'UTC'
    })
    async processExpiredTrials(): Promise<void> {
        if (!this.isSchedulingEnabled) {
            this.logger.debug('Trial expiration processing skipped - scheduling disabled');
            return;
        }

        const startTime = Date.now();
        const context = { jobName: 'processExpiredTrials', startTime };

        this.logger.log('Starting scheduled expired trials processing', context);

        try {
            const result = await this.subscriptionsService.processTrialExpiration();

            this.logJobCompletion(context, result, Date.now() - startTime);

            if (result.errors.length > 0) {
                this.logger.warn(
                    'Errors occurred during trial expiration processing',
                    { ...context, errors: result.errors }
                );
            }
        } catch (error) {
            this.logJobError(context, error, Date.now() - startTime);
        }
    }

    /**
     * Notify users about trials ending soon - daily at 10 AM UTC
     * Sends notifications for trials ending in 1-2 days
     */
    @Cron('0 10 * * *', {
        name: 'notifyTrialsEndingSoon',
        timeZone: 'UTC'
    })
    async notifyTrialsEndingSoon(): Promise<void> {
        if (!this.isSchedulingEnabled) {
            this.logger.debug('Trial ending notifications skipped - scheduling disabled');
            return;
        }

        const startTime = Date.now();
        const context = { jobName: 'notifyTrialsEndingSoon', startTime };

        this.logger.log('Starting scheduled trial ending notifications', context);

        try {
            const result = await this.subscriptionsService.processTrialEndingNotifications();

            this.logJobCompletion(context, result, Date.now() - startTime);

            if (result.errors.length > 0) {
                this.logger.warn(
                    'Errors occurred during trial ending notifications',
                    { ...context, errors: result.errors }
                );
            }
        } catch (error) {
            this.logJobError(context, error, Date.now() - startTime);
        }
    }

    /**
     * Get comprehensive scheduler status for monitoring
     */
    getSchedulerStatus() {
        const jobs = [];
        const jobNames = ['processExpiredTrials', 'notifyTrialsEndingSoon'];

        for (const jobName of jobNames) {
            try {
                const job = this.schedulerRegistry.getCronJob(jobName);
                const lastDate = job.lastDate();
                const nextDate = job.nextDate();

                jobs.push({
                    name: jobName,
                    running: job.running,
                    lastRun: lastDate ? (lastDate instanceof Date ? lastDate : (lastDate as any).toJSDate()) : undefined,
                    nextRun: nextDate instanceof Date ? nextDate : (nextDate as any).toJSDate(),
                });
            } catch (error) {
                this.logger.warn(`Could not get status for job: ${jobName}`, { error: error.message });
                jobs.push({
                    name: jobName,
                    running: false,
                    error: error.message,
                });
            }
        }

        return {
            enabled: this.isSchedulingEnabled,
            totalJobs: jobs.length,
            jobs,
            timestamp: new Date(),
        };
    }

    /**
     * Manually trigger expired trials processing (for testing/admin)
     */
    async manualProcessExpiredTrials(): Promise<ProcessingResult> {
        this.logger.log('Manual trigger: Processing expired trials');
        return this.subscriptionsService.processTrialExpiration();
    }

    /**
     * Manually trigger trial ending notifications (for testing/admin)
     */
    async manualNotifyTrialsEndingSoon(): Promise<ProcessingResult> {
        this.logger.log('Manual trigger: Notifying trials ending soon');
        return this.subscriptionsService.processTrialEndingNotifications();
    }

    /**
     * Enable/disable scheduling dynamically (for maintenance)
     */
    async toggleScheduling(enabled: boolean): Promise<void> {
        // This would require updating configuration or using a different approach
        // For now, just log the request
        this.logger.log(`Scheduling toggle requested: ${enabled ? 'enable' : 'disable'}`);

        if (!enabled) {
            this.logger.warn('Scheduling cannot be disabled at runtime without restart');
        }
    }

    private logJobCompletion(
        context: any,
        result: ProcessingResult,
        duration: number
    ): void {
        this.logger.log(
            `Scheduled job completed successfully`,
            {
                ...context,
                duration: `${duration}ms`,
                processedCount: result.processedCount,
                errorCount: result.errors.length,
            }
        );
    }

    private logJobError(
        context: any,
        error: any,
        duration: number
    ): void {
        this.logger.error(
            `Scheduled job failed`,
            {
                ...context,
                duration: `${duration}ms`,
                error: error.message,
                stack: error.stack,
            }
        );

        // In production, you might want to:
        // - Send alerts to monitoring system (e.g., Sentry, DataDog)
        // - Update health check status
        // - Trigger fallback mechanisms
    }
}