import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { JournalEntry } from './entities/journal-entry.entity';

@Injectable()
export class JournalService {
    constructor(
        @InjectRepository(JournalEntry)
        private readonly journalEntryRepository: Repository<JournalEntry>,
    ) { }

    async create(
        userId: string,
        createJournalEntryDto: CreateJournalEntryDto,
    ): Promise<JournalEntry> {
        const journalEntry = this.journalEntryRepository.create({
            ...createJournalEntryDto,
            userId,
        });

        return await this.journalEntryRepository.save(journalEntry);
    }

    async findAll(
        userId: string,
        options?: FindManyOptions<JournalEntry>,
    ): Promise<JournalEntry[]> {
        return await this.journalEntryRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            ...options,
        });
    }

    async findById(id: string, userId: string): Promise<JournalEntry> {
        const journalEntry = await this.journalEntryRepository.findOne({
            where: { id, userId },
        });

        if (!journalEntry) {
            throw new NotFoundException('Journal entry not found');
        }

        return journalEntry;
    }

    async update(
        id: string,
        userId: string,
        updateJournalEntryDto: UpdateJournalEntryDto,
    ): Promise<JournalEntry> {
        const journalEntry = await this.findById(id, userId);

        Object.assign(journalEntry, updateJournalEntryDto);

        return await this.journalEntryRepository.save(journalEntry);
    }

    async remove(id: string, userId: string): Promise<void> {
        const journalEntry = await this.findById(id, userId);
        await this.journalEntryRepository.remove(journalEntry);
    }

    // Semantic search using vector similarity
    async semanticSearch(
        userId: string,
        queryVector: number[],
        limit: number = 10,
    ): Promise<JournalEntry[]> {
        // Using pgvector similarity search
        return await this.journalEntryRepository
            .createQueryBuilder('journal')
            .where('journal.userId = :userId', { userId })
            .andWhere('journal.contentVector IS NOT NULL')
            .orderBy('journal.contentVector <-> :vector', 'ASC')
            .setParameter('vector', JSON.stringify(queryVector))
            .limit(limit)
            .getMany();
    }

    async searchByContent(
        userId: string,
        searchTerm: string,
        limit: number = 10,
    ): Promise<JournalEntry[]> {
        return await this.journalEntryRepository
            .createQueryBuilder('journal')
            .where('journal.userId = :userId', { userId })
            .andWhere('(journal.content ILIKE :searchTerm OR journal.transcription ILIKE :searchTerm)',
                { searchTerm: `%${searchTerm}%` })
            .orderBy('journal.createdAt', 'DESC')
            .limit(limit)
            .getMany();
    }

    async findByEmotionalState(
        userId: string,
        primaryEmotion: string,
    ): Promise<JournalEntry[]> {
        return await this.journalEntryRepository
            .createQueryBuilder('journal')
            .where('journal.userId = :userId', { userId })
            .andWhere('journal.emotionalState->>\'primaryEmotion\' = :primaryEmotion', { primaryEmotion })
            .orderBy('journal.createdAt', 'DESC')
            .getMany();
    }

    async getEmotionalTrends(userId: string, days: number = 30): Promise<{
        averageSentiment: number;
        emotionBreakdown: Record<string, number>;
        sentimentTrend: Array<{ date: string; sentiment: number }>;
        totalEntries: number;
    }> {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        const entries = await this.journalEntryRepository
            .createQueryBuilder('journal')
            .where('journal.userId = :userId', { userId })
            .andWhere('journal.createdAt >= :startDate', { startDate })
            .andWhere('journal.createdAt <= :endDate', { endDate })
            .orderBy('journal.createdAt', 'ASC')
            .getMany();

        if (entries.length === 0) {
            return {
                averageSentiment: 0,
                emotionBreakdown: {},
                sentimentTrend: [],
                totalEntries: 0,
            };
        }

        // Calculate average sentiment
        const totalSentiment = entries.reduce((sum, entry) => sum + (entry.sentimentScore || 0), 0);
        const averageSentiment = totalSentiment / entries.length;

        // Emotion breakdown
        const emotionBreakdown: Record<string, number> = {};
        entries.forEach(entry => {
            if (entry.emotionalState?.primaryEmotion) {
                const emotion = entry.emotionalState.primaryEmotion;
                emotionBreakdown[emotion] = (emotionBreakdown[emotion] || 0) + 1;
            }
        });

        // Sentiment trend (daily averages)
        const sentimentTrend: Array<{ date: string; sentiment: number }> = [];
        const dailySentiments: Record<string, number[]> = {};

        entries.forEach(entry => {
            const date = entry.createdAt.toISOString().split('T')[0];
            if (!dailySentiments[date]) {
                dailySentiments[date] = [];
            }
            if (entry.sentimentScore !== null) {
                dailySentiments[date].push(entry.sentimentScore);
            }
        });

        Object.entries(dailySentiments).forEach(([date, sentiments]) => {
            const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
            sentimentTrend.push({ date, sentiment: Math.round(avgSentiment * 100) / 100 });
        });

        return {
            averageSentiment: Math.round(averageSentiment * 100) / 100,
            emotionBreakdown,
            sentimentTrend,
            totalEntries: entries.length,
        };
    }

    async createFromVoiceNote(
        userId: string,
        transcription: string,
        aiAnalysis: any,
        audioFileUrl?: string,
    ): Promise<JournalEntry> {
        const journalEntry = await this.create(userId, {
            content: aiAnalysis.summary || transcription,
            transcription,
            sentimentScore: aiAnalysis.sentiment || 0,
            emotionalState: aiAnalysis.primaryEmotion || 'NEUTRAL',
            audioFileUrl,
            contentVector: aiAnalysis.embedding || [],
            tags: aiAnalysis.tags || [],
            insights: aiAnalysis.insights || [],
        });

        return journalEntry;
    }
}