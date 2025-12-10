import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceNotesModule } from '../voice-notes/voice-notes.module';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([JournalEntry]),
        VoiceNotesModule, // For voice processing service
    ],
    controllers: [JournalController],
    providers: [JournalService],
    exports: [JournalService],
})
export class JournalModule { }