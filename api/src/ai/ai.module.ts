import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
    imports: [ChatModule],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }