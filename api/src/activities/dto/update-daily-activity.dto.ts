import { PartialType } from '@nestjs/swagger';
import { CreateDailyActivityDto } from './create-daily-activity.dto';

export class UpdateDailyActivityDto extends PartialType(CreateDailyActivityDto) { }