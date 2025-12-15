import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @IsOptional()
    progressPercentage?: number;

    @IsOptional()
    actualMinutes?: number;

    @IsOptional()
    completedAt?: Date;

    @IsOptional()
    subtasks?: Array<{
        id?: string;
        title: string;
        completed?: boolean;
    }>;

    @IsOptional()
    dueDate?: Date;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}