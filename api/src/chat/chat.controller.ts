import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateChatMessageDto, UpdateChatMessageDto } from './dto/chat-message.dto';
import { CreateChatSessionDto, UpdateChatSessionDto } from './dto/chat-session.dto';
import { ChatSessionType } from './entities/chat-session.entity';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('sessions')
    async createSession(@Req() req, @Body() createSessionDto: CreateChatSessionDto) {
        return this.chatService.createSession(req.user.id, createSessionDto);
    }

    @Get('sessions')
    async findAllSessions(@Req() req, @Query('type') type?: ChatSessionType) {
        return this.chatService.findAllSessions(req.user.id, type);
    }

    @Get('sessions/:id')
    async findSession(@Req() req, @Param('id') sessionId: string) {
        return this.chatService.findSessionById(sessionId, req.user.id);
    }

    @Patch('sessions/:id')
    async updateSession(
        @Req() req,
        @Param('id') sessionId: string,
        @Body() updateSessionDto: UpdateChatSessionDto
    ) {
        return this.chatService.updateSession(sessionId, req.user.id, updateSessionDto);
    }

    @Post('sessions/:id/archive')
    async archiveSession(@Req() req, @Param('id') sessionId: string) {
        await this.chatService.archiveSession(sessionId, req.user.id);
        return { message: 'Session archived successfully' };
    }

    @Delete('sessions/:id')
    async deleteSession(@Req() req, @Param('id') sessionId: string) {
        await this.chatService.deleteSession(sessionId, req.user.id);
        return { message: 'Session deleted successfully' };
    }

    @Post('messages')
    async addMessage(@Req() req, @Body() createMessageDto: CreateChatMessageDto) {
        return this.chatService.addMessage(req.user.id, createMessageDto);
    }

    @Get('sessions/:id/messages')
    async getMessages(@Req() req, @Param('id') sessionId: string) {
        return this.chatService.findMessagesBySession(sessionId, req.user.id);
    }

    @Patch('messages/:id')
    async updateMessage(
        @Req() req,
        @Param('id') messageId: string,
        @Body() updateMessageDto: UpdateChatMessageDto
    ) {
        return this.chatService.updateMessage(messageId, req.user.id, updateMessageDto);
    }

    @Delete('messages/:id')
    async deleteMessage(@Req() req, @Param('id') messageId: string) {
        await this.chatService.deleteMessage(messageId, req.user.id);
        return { message: 'Message deleted successfully' };
    }

    @Get('stats')
    async getStats(@Req() req) {
        return this.chatService.getSessionStats(req.user.id);
    }
}