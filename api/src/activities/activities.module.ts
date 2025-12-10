import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { DailyActivity } from './entities/daily-activity.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DailyActivity,
        ]),
    ],
    controllers: [
        ActivitiesController,
    ],
    providers: [
        ActivitiesService,
    ],
    exports: [
        ActivitiesService,
    ],
})
export class ActivitiesModule { }