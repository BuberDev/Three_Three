import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskPriority, TaskStatus } from '../entities/task.entity';

export class SearchTasksDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    query?: string;

    @ApiProperty({ enum: TaskStatus, required: false })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @ApiProperty({ enum: TaskPriority, required: false })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    dueDateFrom?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    dueDateTo?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isOverdue?: boolean;

    @ApiProperty({ required: false, default: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiProperty({ required: false, default: 'DESC' })
    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC';

    @ApiProperty({ required: false, default: 50 })
    @IsOptional()
    limit?: number;

    @ApiProperty({ required: false, default: 0 })
    @IsOptional()
    offset?: number;
}