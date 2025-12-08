import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { Task } from './entities/task.entity';
import { TaskReminderProcessor } from './processors/task-reminder.processor';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task]),
        BullModule.registerQueue({
            name: 'task-reminders',
        }),
        EventsModule,
        UsersModule,
    ],
    controllers: [TasksController],
    providers: [TasksService, TaskReminderProcessor],
    exports: [TasksService],
})
export class TasksModule { }