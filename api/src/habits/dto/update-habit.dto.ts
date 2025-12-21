import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { HabitStatus } from '../entities/habit.entity';
import { CreateHabitDto } from './create-habit.dto';

export class UpdateHabitDto extends PartialType(CreateHabitDto) {
    @ApiProperty({
        enum: HabitStatus,
        description: 'Status of the habit',
        required: false,
    })
    @IsOptional()
    @IsEnum(HabitStatus)
    status?: HabitStatus;
}