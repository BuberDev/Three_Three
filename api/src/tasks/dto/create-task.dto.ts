import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskPriority, TaskSource } from '../entities/task.entity';

export class CreateTaskDto {
    @ApiProperty({
        description: 'Task title',
        example: 'Complete project documentation',
    })
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Task description',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        enum: TaskPriority,
        description: 'Task priority',
        default: TaskPriority.MEDIUM,
        required: false,
    })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiProperty({
        description: 'Due date for the task',
        required: false,
    })
    @IsOptional()
    dueDate?: Date;

    @ApiProperty({
        description: 'Estimated time in minutes',
        required: false,
    })
    @IsOptional()
    estimatedMinutes?: number;

    @ApiProperty({
        description: 'Task tags',
        type: [String],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiProperty({
        description: 'Subtasks',
        required: false,
    })
    @IsOptional()
    subtasks?: Array<{
        id?: string;
        title: string;
        completed?: boolean;
    }>;

    @ApiProperty({
        enum: TaskSource,
        description: 'Source of task creation',
        default: TaskSource.MANUAL,
        required: false,
    })
    @IsOptional()
    @IsEnum(TaskSource)
    source?: TaskSource;

    @ApiProperty({
        description: 'Parent task ID for subtasks',
        required: false,
    })
    @IsOptional()
    @IsString()
    parentTaskId?: string;

    @ApiProperty({
        description: 'Whether this task is recurring',
        required: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isRecurring?: boolean;

    @ApiProperty({
        description: 'Pattern for recurring tasks',
        required: false,
        type: 'object',
        example: {
            type: 'daily',
            interval: 1,
            endDate: '2024-12-31T00:00:00Z'
        },
    })
    @IsOptional()
    recurringPattern?: {
        type: 'daily' | 'weekly' | 'monthly';
        interval: number;
        endDate?: Date;
    };

    @ApiProperty({
        description: 'Additional metadata for the task',
        required: false,
        type: 'object',
    })
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiProperty({
        description: 'Task category',
        required: false,
        example: 'work',
    })
    @IsOptional()
    @IsString()
    category?: string;
}