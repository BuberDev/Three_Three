import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SleepTracking } from './entities/sleep-tracking.entity';
import { SleepTrackingController } from './sleep-tracking.controller';
import { SleepTrackingService } from './sleep-tracking.service';

@Module({
    imports: [TypeOrmModule.forFeature([SleepTracking])],
    controllers: [SleepTrackingController],
    providers: [SleepTrackingService],
    exports: [SleepTrackingService],
})
export class SleepModule { }