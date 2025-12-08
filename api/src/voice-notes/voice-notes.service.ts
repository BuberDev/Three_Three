import { InjectQueue } from '@nestjs/bull';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FindManyOptions, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateVoiceNoteDto } from './dto/create-voice-note.dto';
import { SearchVoiceNotesDto } from './dto/search-voice-notes.dto';
import { UpdateVoiceNoteDto } from './dto/update-voice-note.dto';
import { ProcessingStatus, VoiceNote } from './entities/voice-note.entity';

@Injectable()
export class VoiceNotesService {
    constructor(
        @InjectRepository(VoiceNote)
        private readonly voiceNoteRepository: Repository<VoiceNote>,
        @InjectQueue('voice-processing')
        private readonly voiceProcessingQueue: Queue,
    ) { }

    async create(
        userId: string,
        createVoiceNoteDto: CreateVoiceNoteDto,
        audioFile: Express.Multer.File,
    ): Promise<VoiceNote> {
        // Validate audio file
        if (!audioFile) {
            throw new BadRequestException('Audio file is required');
        }

        // Validate file type and size
        const allowedMimeTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a'];
        if (!allowedMimeTypes.includes(audioFile.mimetype)) {
            throw new BadRequestException('Invalid audio file format');
        }

        const maxFileSize = 50 * 1024 * 1024; // 50MB
        if (audioFile.size > maxFileSize) {
            throw new BadRequestException('Audio file too large (max 50MB)');
        }

        // Save audio file
        const uploadsDir = path.join(process.cwd(), 'uploads', 'voice-notes');
        await fs.mkdir(uploadsDir, { recursive: true });

        const fileExtension = path.extname(audioFile.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        await fs.writeFile(filePath, audioFile.buffer);

        // Create voice note entity
        const voiceNote = this.voiceNoteRepository.create({
            ...createVoiceNoteDto,
            userId,
            audioFilePath: filePath,
            fileSize: audioFile.size,
            mimeType: audioFile.mimetype,
            processingStatus: ProcessingStatus.PENDING,
            metadata: {
                originalFileName: audioFile.originalname,
                uploadedAt: new Date(),
            },
        });

        const savedVoiceNote = await this.voiceNoteRepository.save(voiceNote);

        // Queue for processing
        await this.voiceProcessingQueue.add('process-voice-note', {
            voiceNoteId: savedVoiceNote.id,
        });

        return savedVoiceNote;
    }

    async findAll(
        userId: string,
        options?: FindManyOptions<VoiceNote>,
    ): Promise<VoiceNote[]> {
        return this.voiceNoteRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            ...options,
        });
    }

    async findById(id: string, userId: string): Promise<VoiceNote> {
        const voiceNote = await this.voiceNoteRepository.findOne({
            where: { id, userId },
            relations: ['user'],
        });

        if (!voiceNote) {
            throw new NotFoundException('Voice note not found');
        }

        return voiceNote;
    }

    async update(
        id: string,
        userId: string,
        updateVoiceNoteDto: UpdateVoiceNoteDto,
    ): Promise<VoiceNote> {
        const voiceNote = await this.findById(id, userId);

        Object.assign(voiceNote, updateVoiceNoteDto);
        return this.voiceNoteRepository.save(voiceNote);
    }

    async remove(id: string, userId: string): Promise<void> {
        const voiceNote = await this.findById(id, userId);

        // Delete audio file
        try {
            await fs.unlink(voiceNote.audioFilePath);
        } catch (error) {
            console.error('Failed to delete audio file:', error);
        }

        await this.voiceNoteRepository.softDelete(id);
    }

    async search(
        userId: string,
        searchDto: SearchVoiceNotesDto,
    ): Promise<VoiceNote[]> {
        const queryBuilder = this.voiceNoteRepository
            .createQueryBuilder('voiceNote')
            .where('voiceNote.userId = :userId', { userId });

        if (searchDto.query) {
            queryBuilder.andWhere(
                '(voiceNote.title ILIKE :query OR voiceNote.transcription ILIKE :query OR voiceNote.summary ILIKE :query)',
                { query: `%${searchDto.query}%` },
            );
        }

        if (searchDto.tags && searchDto.tags.length > 0) {
            queryBuilder.andWhere('voiceNote.tags && :tags', {
                tags: searchDto.tags,
            });
        }

        if (searchDto.dateFrom) {
            queryBuilder.andWhere('voiceNote.createdAt >= :dateFrom', {
                dateFrom: searchDto.dateFrom,
            });
        }

        if (searchDto.dateTo) {
            queryBuilder.andWhere('voiceNote.createdAt <= :dateTo', {
                dateTo: searchDto.dateTo,
            });
        }

        if (searchDto.processingStatus) {
            queryBuilder.andWhere('voiceNote.processingStatus = :status', {
                status: searchDto.processingStatus,
            });
        }

        return queryBuilder
            .orderBy('voiceNote.createdAt', 'DESC')
            .limit(searchDto.limit || 50)
            .offset(searchDto.offset || 0)
            .getMany();
    }

    async semanticSearch(
        userId: string,
        embedding: number[],
        limit = 10,
    ): Promise<VoiceNote[]> {
        // Using pgvector for semantic search
        const query = `
      SELECT *, embedding <-> $1 as distance
      FROM voice_notes 
      WHERE user_id = $2 
        AND embedding IS NOT NULL
        AND processing_status = 'completed'
      ORDER BY distance
      LIMIT $3
    `;

        const result = await this.voiceNoteRepository.query(query, [
            `[${embedding.join(',')}]`,
            userId,
            limit,
        ]);

        return result.map((row: any) => {
            const { distance, ...voiceNote } = row;
            return voiceNote;
        });
    }

    async updateProcessingStatus(
        id: string,
        status: ProcessingStatus,
        error?: string,
    ): Promise<void> {
        const updateData: Partial<VoiceNote> = {
            processingStatus: status,
        };

        if (status === ProcessingStatus.PROCESSING) {
            updateData.processingStartedAt = new Date();
        }

        if (status === ProcessingStatus.COMPLETED) {
            updateData.processingCompletedAt = new Date();
        }

        if (status === ProcessingStatus.FAILED && error) {
            updateData.processingError = error;
        }

        await this.voiceNoteRepository.update(id, updateData);
    }

    async updateProcessingResults(
        id: string,
        results: {
            transcription?: string;
            summary?: string;
            title?: string;
            embedding?: number[];
            tags?: string[];
            extractedEntities?: Array<{ type: string; value: string; confidence: number }>;
            sentiment?: number;
            insights?: Record<string, any>;
        },
    ): Promise<void> {
        await this.voiceNoteRepository.update(id, results);
    }

    async getProcessingStats(userId: string): Promise<{
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    }> {
        const stats = await this.voiceNoteRepository
            .createQueryBuilder('voiceNote')
            .select('voiceNote.processingStatus', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('voiceNote.userId = :userId', { userId })
            .groupBy('voiceNote.processingStatus')
            .getRawMany();

        const result = {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
        };

        stats.forEach((stat) => {
            const count = parseInt(stat.count, 10);
            result.total += count;
            result[stat.status as keyof typeof result] = count;
        });

        return result;
    }
}