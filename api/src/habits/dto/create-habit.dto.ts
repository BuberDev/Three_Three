import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { HabitCategory, HabitFrequency } from '../entities/habit.entity';

export class ReminderSettingsDto {
    @ApiProperty({
        description: 'Whether reminders are enabled',
        default: false,
    })
    @IsBoolean()
    enabled: boolean;

    @ApiProperty({
        description: 'Time for reminder in HH:MM format',
        example: '09:00',
        required: false,
    })
    @IsOptional()
    @IsString()
    time?: string;

    @ApiProperty({
        description: 'Days of week for reminders (0=Sunday, 6=Saturday)',
        type: [Number],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(0, { each: true })
    @Max(6, { each: true })
    days?: number[];
}

export class CreateHabitDto {
    @ApiProperty({
        description: 'Habit name',
        example: 'Daily meditation',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Habit description',
        example: '10 minutes of mindfulness meditation',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        enum: HabitFrequency,
        description: 'How often the habit should be performed',
        default: HabitFrequency.DAILY,
    })
    @IsEnum(HabitFrequency)
    frequency: HabitFrequency;

    @ApiProperty({
        enum: HabitCategory,
        description: 'Category of the habit',
        default: HabitCategory.PERSONAL,
    })
    @IsEnum(HabitCategory)
    category: HabitCategory;

    @ApiProperty({
        description: 'Target number of days (for weekly/monthly habits)',
        required: false,
        minimum: 1,
        maximum: 31,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(31)
    targetDays?: number;

    @ApiProperty({
        description: 'Reminder settings',
        type: ReminderSettingsDto,
        required: false,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => ReminderSettingsDto)
    reminderSettings?: ReminderSettingsDto;

    @ApiProperty({
        description: 'Custom metadata for the habit',
        required: false,
    })
    @IsOptional()
    customFields?: Record<string, any>;
}