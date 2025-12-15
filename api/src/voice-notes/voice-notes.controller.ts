import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateVoiceNoteDto } from './dto/create-voice-note.dto';
import { SearchVoiceNotesDto } from './dto/search-voice-notes.dto';
import { SemanticSearchDto } from './dto/semantic-search.dto';
import { UpdateVoiceNoteDto } from './dto/update-voice-note.dto';
import { ProcessingStatus, VoiceNote } from './entities/voice-note.entity';
import { VoiceNotesService } from './voice-notes.service';
import { VoiceProcessingService } from './voice-processing.service';

@ApiTags('Voice Notes')
@Controller('voice-notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceNotesController {
    constructor(
        private readonly voiceNotesService: VoiceNotesService,
        private readonly voiceProcessingService: VoiceProcessingService,
    ) { }

    @Post()
    @UseInterceptors(
        FileInterceptor('audio', {
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB
            },
            fileFilter: (req, file, cb) => {
                console.log('🔍 Incoming file validation:', {
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    encoding: file.encoding
                });

                const allowedMimeTypes = [
                    'audio/wav',
                    'audio/mp3',
                    'audio/mpeg',
                    'audio/aac',
                    'audio/m4a',
                    'audio/mp4',
                    'audio/x-m4a',
                    'audio/flac',
                    'audio/ogg',
                    'audio/webm',
                    'application/octet-stream', // Sometimes files come without proper MIME type
                ];

                console.log('🎵 Allowed MIME types:', allowedMimeTypes);
                console.log('📄 File MIME type:', file.mimetype);

                if (allowedMimeTypes.includes(file.mimetype)) {
                    console.log('✅ File MIME type accepted');
                    cb(null, true);
                } else {
                    console.log('❌ File MIME type rejected');
                    cb(new BadRequestException('Invalid audio file format'), false);
                }
            },
        }),
    )
    @ApiOperation({ summary: 'Create a new voice note with audio upload' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                audio: {
                    type: 'string',
                    format: 'binary',
                    description: 'Audio file (wav, mp3, m4a, etc.)',
                },
                title: {
                    type: 'string',
                    description: 'Optional title',
                    maxLength: 500,
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional tags',
                },
                metadata: {
                    type: 'object',
                    description: 'Optional metadata',
                },
            },
            required: ['audio'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Voice note created and queued for processing',
        type: VoiceNote,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid file or validation failed',
    })
    async create(
        @CurrentUser() user: User,
        @Body() createVoiceNoteDto: CreateVoiceNoteDto,
        @UploadedFile() audioFile: Express.Multer.File,
    ): Promise<VoiceNote> {
        return this.voiceNotesService.create(
            user.id,
            createVoiceNoteDto,
            audioFile,
        );
    }

    @Get()
    @ApiOperation({ summary: 'Get all voice notes for current user' })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Limit number of results',
    })
    @ApiQuery({
        name: 'offset',
        required: false,
        type: Number,
        description: 'Skip number of results',
    })
    @ApiResponse({
        status: 200,
        description: 'List of voice notes retrieved successfully',
        type: [VoiceNote],
    })
    findAll(
        @CurrentUser() user: User,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<VoiceNote[]> {
        const options = {
            take: limit ? parseInt(limit, 10) : undefined,
            skip: offset ? parseInt(offset, 10) : undefined,
        };
        return this.voiceNotesService.findAll(user.id, options);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search voice notes' })
    @ApiResponse({
        status: 200,
        description: 'Search results retrieved successfully',
        type: [VoiceNote],
    })
    search(
        @CurrentUser() user: User,
        @Query() searchDto: SearchVoiceNotesDto,
    ): Promise<VoiceNote[]> {
        return this.voiceNotesService.search(user.id, searchDto);
    }

    @Post('search/semantic')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Semantic search for similar voice notes' })
    @ApiResponse({
        status: 200,
        description: 'Semantic search results retrieved successfully',
        type: [VoiceNote],
    })
    async semanticSearch(
        @CurrentUser() user: User,
        @Body() searchDto: SemanticSearchDto,
    ): Promise<VoiceNote[]> {
        // Generate embedding for search query
        const embedding = await this.voiceProcessingService.searchSimilarContent(
            searchDto.query,
        );

        return this.voiceNotesService.semanticSearch(
            user.id,
            embedding,
            searchDto.limit || 10,
        );
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get processing statistics' })
    @ApiResponse({
        status: 200,
        description: 'Processing statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number' },
                pending: { type: 'number' },
                processing: { type: 'number' },
                completed: { type: 'number' },
                failed: { type: 'number' },
            },
        },
    })
    getStats(@CurrentUser() user: User) {
        return this.voiceNotesService.getProcessingStats(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get voice note by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Voice note retrieved successfully',
        type: VoiceNote,
    })
    @ApiResponse({
        status: 404,
        description: 'Voice note not found',
    })
    findOne(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<VoiceNote> {
        return this.voiceNotesService.findById(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update voice note' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Voice note updated successfully',
        type: VoiceNote,
    })
    @ApiResponse({
        status: 404,
        description: 'Voice note not found',
    })
    update(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateVoiceNoteDto: UpdateVoiceNoteDto,
    ): Promise<VoiceNote> {
        return this.voiceNotesService.update(id, user.id, updateVoiceNoteDto);
    }

    @Post(':id/reprocess')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reprocess voice note (retry processing)' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Voice note queued for reprocessing',
    })
    @ApiResponse({
        status: 404,
        description: 'Voice note not found',
    })
    async reprocess(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{ message: string }> {
        const voiceNote = await this.voiceNotesService.findById(id, user.id);

        // Reset status and re-queue for processing
        await this.voiceNotesService.updateProcessingStatus(
            id,
            ProcessingStatus.PENDING,
        );

        // Add to processing queue
        // Note: This would need access to the Bull queue - should be refactored

        return { message: 'Voice note queued for reprocessing' };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete voice note' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 204,
        description: 'Voice note deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Voice note not found',
    })
    remove(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        return this.voiceNotesService.remove(id, user.id);
    }

    @Get('audio/:filename')
    @ApiOperation({ summary: 'Serve audio file' })
    @ApiParam({ name: 'filename', type: 'string', description: 'Audio filename' })
    @ApiResponse({
        status: 200,
        description: 'Audio file served successfully',
        headers: {
            'Content-Type': {
                description: 'Audio MIME type',
                schema: { type: 'string' }
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Audio file not found',
    })
    async serveAudio(
        @Param('filename') filename: string,
        @CurrentUser() user: User,
        @Res() res: Response,
    ): Promise<void> {
        try {
            // Security: Verify user owns this file
            const voiceNote = await this.voiceNotesService.findByFilename(filename, user.id);
            if (!voiceNote) {
                res.status(404).json({
                    message: 'Audio file not found or access denied',
                    code: 'AUDIO_NOT_FOUND'
                });
                return;
            }

            // Security: Only allow specific extensions
            const allowedExtensions = ['.wav', '.mp3', '.m4a', '.mp4', '.flac', '.ogg'];
            const ext = path.extname(filename).toLowerCase();

            if (!allowedExtensions.includes(ext)) {
                throw new BadRequestException('Invalid audio file format');
            }

            // Build file path
            const uploadsDir = path.join(process.cwd(), 'uploads', 'voice-notes');
            const filePath = path.join(uploadsDir, filename);

            // Security: Prevent path traversal
            if (!filePath.startsWith(uploadsDir)) {
                throw new BadRequestException('Invalid file path');
            }

            // Check if file exists
            try {
                await fs.access(filePath);
            } catch {
                res.status(404).json({
                    statusCode: 404,
                    message: 'Audio file not found',
                    error: 'Not Found'
                });
                return;
            }

            // Get file stats
            const stats = await fs.stat(filePath);

            // Set appropriate headers
            const mimeTypes: Record<string, string> = {
                '.wav': 'audio/wav',
                '.mp3': 'audio/mpeg',
                '.m4a': 'audio/mp4',
                '.mp4': 'audio/mp4',
                '.flac': 'audio/flac',
                '.ogg': 'audio/ogg',
            };

            res.set({
                'Content-Type': mimeTypes[ext] || 'audio/mpeg',
                'Content-Length': stats.size.toString(),
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=31536000', // 1 year cache
            });

            // Stream the file
            const fileBuffer = await fs.readFile(filePath);
            res.send(fileBuffer);

        } catch (error) {
            if (error instanceof BadRequestException) {
                res.status(400).json({
                    statusCode: 400,
                    message: error.message,
                    error: 'Bad Request'
                });
            } else {
                res.status(500).json({
                    statusCode: 500,
                    message: 'Internal server error',
                    error: 'Internal Server Error'
                });
            }
        }
    }
}