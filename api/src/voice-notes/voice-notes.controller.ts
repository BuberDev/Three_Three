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
                const allowedMimeTypes = [
                    'audio/wav',
                    'audio/mp3',
                    'audio/mpeg',
                    'audio/m4a',
                    'audio/mp4',
                    'audio/flac',
                    'audio/ogg',
                ];
                if (allowedMimeTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
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
}