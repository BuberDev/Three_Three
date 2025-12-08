import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { VoiceNote } from './entities/voice-note.entity';
import { VoiceProcessingProcessor } from './processors/voice-processing.processor';
import { VoiceNotesController } from './voice-notes.controller';
import { VoiceNotesService } from './voice-notes.service';
import { VoiceProcessingService } from './voice-processing.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([VoiceNote]),
        BullModule.registerQueue({
            name: 'voice-processing',
        }),
        UsersModule,
        EventsModule,
    ],
    controllers: [VoiceNotesController],
    providers: [
        VoiceNotesService,
        VoiceProcessingService,
        VoiceProcessingProcessor,
    ],
    exports: [VoiceNotesService],
})
export class VoiceNotesModule { }