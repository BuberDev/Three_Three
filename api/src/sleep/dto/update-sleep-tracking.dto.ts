import { PartialType } from '@nestjs/swagger';
import { CreateSleepTrackingDto } from './create-sleep-tracking.dto';

export class UpdateSleepTrackingDto extends PartialType(CreateSleepTrackingDto) { }