import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('task-reminders')
@Injectable()
export class TaskReminderProcessor {
    private readonly logger = new Logger(TaskReminderProcessor.name);

    @Process('send-reminder')
    async sendTaskReminder(job: Job<{ taskId: string; userId: string }>) {
        const { taskId, userId } = job.data;

        this.logger.log(`Sending task reminder for task: ${taskId}, user: ${userId}`);

        // Here you would implement actual reminder logic:
        // - Send push notification
        // - Send email
        // - Create in-app notification

        // For now, just log the reminder
        this.logger.log(`Task reminder sent successfully for task: ${taskId}`);
    }
}