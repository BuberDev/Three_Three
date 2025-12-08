import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { SearchTasksDto } from './dto/search-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
        return this.tasksService.create(user.id, createTaskDto);
    }

    @Get()
    findAll(@CurrentUser() user: User) {
        return this.tasksService.findAll(user.id);
    }

    @Get('search')
    search(@Query() searchDto: SearchTasksDto, @CurrentUser() user: User) {
        return this.tasksService.search(user.id, searchDto);
    }

    @Get('stats')
    getStats(@CurrentUser() user: User) {
        return this.tasksService.getTaskStats(user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: User) {
        return this.tasksService.findById(id, user.id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
        @CurrentUser() user: User,
    ) {
        return this.tasksService.update(id, user.id, updateTaskDto);
    }

    @Patch(':id/complete')
    markCompleted(@Param('id') id: string, @CurrentUser() user: User) {
        return this.tasksService.markCompleted(id, user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: User) {
        return this.tasksService.remove(id, user.id);
    }
}