import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventProcessingProcessor } from './processors/event-processing.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([Event]),
        BullModule.registerQueue({
            name: 'event-processing',
        }),
    ],
    controllers: [EventsController],
    providers: [EventsService, EventProcessingProcessor],
    exports: [EventsService],
})
export class EventsModule { }