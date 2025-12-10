import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { VoiceProcessingService } from '../voice-notes/voice-processing.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { SemanticSearchJournalDto } from './dto/semantic-search-journal.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalService } from './journal.service';

@ApiTags('Journal')
@Controller('journal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JournalController {
    constructor(
        private readonly journalService: JournalService,
        private readonly voiceProcessingService: VoiceProcessingService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new journal entry' })
    @ApiResponse({
        status: 201,
        description: 'Journal entry created successfully',
        type: JournalEntry,
    })
    create(
        @CurrentUser() user: User,
        @Body() createJournalEntryDto: CreateJournalEntryDto,
    ): Promise<JournalEntry> {
        return this.journalService.create(user.id, createJournalEntryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all journal entries for current user' })
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
        description: 'List of journal entries retrieved successfully',
        type: [JournalEntry],
    })
    findAll(
        @CurrentUser() user: User,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<JournalEntry[]> {
        const options = {
            take: limit ? parseInt(limit, 10) : undefined,
            skip: offset ? parseInt(offset, 10) : undefined,
        };
        return this.journalService.findAll(user.id, options);
    }

    @Post('semantic-search')
    @ApiOperation({ summary: 'Perform semantic search on journal entries' })
    @ApiResponse({
        status: 200,
        description: 'Semantic search results retrieved successfully',
        type: [JournalEntry],
    })
    async semanticSearch(
        @CurrentUser() user: User,
        @Body() searchDto: SemanticSearchJournalDto,
    ): Promise<JournalEntry[]> {
        // Generate embedding for search query
        const embedding = await this.voiceProcessingService.searchSimilarContent(searchDto.query);

        return this.journalService.semanticSearch(
            user.id,
            embedding,
            searchDto.limit || 10,
        );
    }

    @Get('search')
    @ApiOperation({ summary: 'Search journal entries by content' })
    @ApiQuery({ name: 'q', required: true, type: String, description: 'Search term' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum results (default: 10)' })
    @ApiResponse({
        status: 200,
        description: 'Search results retrieved successfully',
        type: [JournalEntry],
    })
    searchByContent(
        @CurrentUser() user: User,
        @Query('q') searchTerm: string,
        @Query('limit') limit?: string,
    ): Promise<JournalEntry[]> {
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        return this.journalService.searchByContent(user.id, searchTerm, limitNumber);
    }

    @Get('emotions/trends')
    @ApiOperation({ summary: 'Get emotional trends from journal entries' })
    @ApiQuery({
        name: 'days',
        required: false,
        type: Number,
        description: 'Number of days to analyze (default: 30)',
    })
    @ApiResponse({
        status: 200,
        description: 'Emotional trends retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                averageSentiment: { type: 'number' },
                emotionBreakdown: { type: 'object' },
                sentimentTrend: { type: 'array' },
                totalEntries: { type: 'number' },
            },
        },
    })
    getEmotionalTrends(
        @CurrentUser() user: User,
        @Query('days') days?: string,
    ) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.journalService.getEmotionalTrends(user.id, daysNumber);
    }

    @Get('by-emotion/:emotion')
    @ApiOperation({ summary: 'Get journal entries by emotional state' })
    @ApiParam({ name: 'emotion', type: 'string', description: 'Emotional state' })
    @ApiResponse({
        status: 200,
        description: 'Journal entries by emotion retrieved successfully',
        type: [JournalEntry],
    })
    findByEmotion(
        @CurrentUser() user: User,
        @Param('emotion') emotion: string,
    ): Promise<JournalEntry[]> {
        return this.journalService.findByEmotionalState(user.id, emotion);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get journal entry by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Journal entry retrieved successfully',
        type: JournalEntry,
    })
    @ApiResponse({
        status: 404,
        description: 'Journal entry not found',
    })
    findOne(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<JournalEntry> {
        return this.journalService.findById(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update journal entry' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Journal entry updated successfully',
        type: JournalEntry,
    })
    @ApiResponse({
        status: 404,
        description: 'Journal entry not found',
    })
    update(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateJournalEntryDto: UpdateJournalEntryDto,
    ): Promise<JournalEntry> {
        return this.journalService.update(id, user.id, updateJournalEntryDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete journal entry' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 204,
        description: 'Journal entry deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Journal entry not found',
    })
    remove(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        return this.journalService.remove(id, user.id);
    }
}