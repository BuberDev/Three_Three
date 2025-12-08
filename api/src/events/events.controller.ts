import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    create(@Body() createEventDto: CreateEventDto) {
        return this.eventsService.create(createEventDto);
    }

    @Get()
    findAll(@CurrentUser() user: User, @Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.eventsService.findAll(user.id, { take: limitNum });
    }

    @Get('stats')
    getStats(@CurrentUser() user: User) {
        return this.eventsService.getEventStats(user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.eventsService.findById(id);
    }
}