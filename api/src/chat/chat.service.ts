import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChatMessageDto, UpdateChatMessageDto } from './dto/chat-message.dto';
import { CreateChatSessionDto, UpdateChatSessionDto } from './dto/chat-session.dto';
import { ChatMessage, MessageRole, MessageStatus } from './entities/chat-message.entity';
import { ChatSession, ChatSessionStatus, ChatSessionType } from './entities/chat-session.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatSession)
        private chatSessionRepository: Repository<ChatSession>,

        @InjectRepository(ChatMessage)
        private chatMessageRepository: Repository<ChatMessage>,
    ) { }

    async createSession(userId: string, createSessionDto: CreateChatSessionDto): Promise<ChatSession> {
        const session = this.chatSessionRepository.create({
            ...createSessionDto,
            userId,
            messageCount: 0,
            totalTokens: 0,
        });

        return this.chatSessionRepository.save(session);
    }

    async findAllSessions(userId: string, type?: ChatSessionType): Promise<ChatSession[]> {
        const query = this.chatSessionRepository.createQueryBuilder('session')
            .where('session.userId = :userId', { userId })
            .andWhere('session.status = :status', { status: ChatSessionStatus.ACTIVE });

        if (type) {
            query.andWhere('session.type = :type', { type });
        }

        return query
            .orderBy('session.lastMessageAt', 'DESC')
            .addOrderBy('session.createdAt', 'DESC')
            .getMany();
    }

    async findSessionById(sessionId: string, userId: string): Promise<ChatSession> {
        const session = await this.chatSessionRepository.findOne({
            where: { id: sessionId, userId },
            relations: ['messages'],
        });

        if (!session) {
            throw new NotFoundException('Chat session not found');
        }

        return session;
    }

    async updateSession(sessionId: string, userId: string, updateSessionDto: UpdateChatSessionDto): Promise<ChatSession> {
        const session = await this.findSessionById(sessionId, userId);

        Object.assign(session, updateSessionDto);
        return this.chatSessionRepository.save(session);
    }

    async archiveSession(sessionId: string, userId: string): Promise<void> {
        const session = await this.findSessionById(sessionId, userId);
        session.status = ChatSessionStatus.ARCHIVED;
        await this.chatSessionRepository.save(session);
    }

    async deleteSession(sessionId: string, userId: string): Promise<void> {
        const session = await this.findSessionById(sessionId, userId);
        await this.chatSessionRepository.softDelete(sessionId);
    }

    async addMessage(userId: string, createMessageDto: CreateChatMessageDto): Promise<ChatMessage> {
        // Verify session belongs to user
        const session = await this.findSessionById(createMessageDto.sessionId, userId);

        const message = this.chatMessageRepository.create({
            ...createMessageDto,
            userId,
            status: MessageStatus.COMPLETED,
            completedAt: new Date(),
        });

        const savedMessage = await this.chatMessageRepository.save(message);

        // Update session stats
        await this.updateSessionStats(session.id);

        return savedMessage;
    }

    async addStreamingMessage(
        userId: string,
        sessionId: string,
        role: MessageRole,
        content: string,
        model?: string,
        usage?: Record<string, any>,
        processingTimeMs?: number
    ): Promise<ChatMessage> {
        try {
            console.log('🔍 addStreamingMessage DEBUG:', {
                userId,
                sessionId,
                role,
                contentLength: content?.length,
                model
            });

            // Verify session belongs to user
            const session = await this.findSessionById(sessionId, userId);
            console.log('🔍 Found session:', session?.id);

            const message = this.chatMessageRepository.create({
                sessionId,
                userId,
                role,
                content,
                model,
                status: MessageStatus.COMPLETED,
                usage,
                processingTimeMs,
                completedAt: new Date(),
                tokenCount: usage?.total_tokens,
            });

            const savedMessage = await this.chatMessageRepository.save(message);
            console.log('🔍 Saved message:', savedMessage?.id);

            // Update session stats
            await this.updateSessionStats(sessionId);
            console.log('🔍 Updated session stats for:', sessionId);

            return savedMessage;
        } catch (error) {
            console.error('🚨 addStreamingMessage ERROR:', error);
            throw error;
        }
    }

    async findMessagesBySession(sessionId: string, userId: string): Promise<ChatMessage[]> {
        // Verify session belongs to user
        await this.findSessionById(sessionId, userId);

        return this.chatMessageRepository.find({
            where: { sessionId },
            order: { createdAt: 'ASC' },
        });
    }

    async updateMessage(messageId: string, userId: string, updateMessageDto: UpdateChatMessageDto): Promise<ChatMessage> {
        const message = await this.chatMessageRepository.findOne({
            where: { id: messageId, userId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        Object.assign(message, updateMessageDto);
        return this.chatMessageRepository.save(message);
    }

    async deleteMessage(messageId: string, userId: string): Promise<void> {
        const message = await this.chatMessageRepository.findOne({
            where: { id: messageId, userId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        await this.chatMessageRepository.softDelete(messageId);

        // Update session stats
        await this.updateSessionStats(message.sessionId);
    }

    private async updateSessionStats(sessionId: string): Promise<void> {
        const messageStats = await this.chatMessageRepository
            .createQueryBuilder('message')
            .select('COUNT(*)', 'count')
            .addSelect('SUM(message.tokenCount)', 'totalTokens')
            .addSelect('MAX(message.createdAt)', 'lastMessageAt')
            .where('message.sessionId = :sessionId', { sessionId })
            .andWhere('message.deletedAt IS NULL')
            .getRawOne();

        await this.chatSessionRepository.update(sessionId, {
            messageCount: parseInt(messageStats.count) || 0,
            totalTokens: parseInt(messageStats.totalTokens) || 0,
            lastMessageAt: messageStats.lastMessageAt || new Date(),
        });
    }

    async getSessionStats(userId: string) {
        const stats = await this.chatSessionRepository
            .createQueryBuilder('session')
            .select('COUNT(*)', 'totalSessions')
            .addSelect('SUM(session.messageCount)', 'totalMessages')
            .addSelect('SUM(session.totalTokens)', 'totalTokens')
            .addSelect('session.type', 'type')
            .where('session.userId = :userId', { userId })
            .andWhere('session.status = :status', { status: ChatSessionStatus.ACTIVE })
            .groupBy('session.type')
            .getRawMany();

        return stats;
    }
}