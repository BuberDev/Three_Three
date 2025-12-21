import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CompleteHabitDto } from './dto/complete-habit.dto';
import { CreateHabitDto } from './dto/create-habit.dto';
import { GetHabitsDto, GetHabitStatsDto } from './dto/get-habits.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { HabitsService } from './habits.service';

@ApiTags('habits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
    constructor(private readonly habitsService: HabitsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new habit' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Habit created successfully',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input data',
    })
    create(@CurrentUser() user: User, @Body() createHabitDto: CreateHabitDto) {
        return this.habitsService.create(user.id, createHabitDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all habits for the user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Habits retrieved successfully',
    })
    findAll(@CurrentUser() user: User, @Query() filters: GetHabitsDto) {
        return this.habitsService.findAll(user.id, filters);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get habit statistics' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Statistics retrieved successfully',
    })
    getStats(@CurrentUser() user: User, @Query() filters: GetHabitStatsDto) {
        return this.habitsService.getHabitStats(user.id, filters);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific habit' })
    @ApiParam({ name: 'id', description: 'Habit ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Habit retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Habit not found',
    })
    findOne(@CurrentUser() user: User, @Param('id') id: string) {
        return this.habitsService.findOne(user.id, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a habit' })
    @ApiParam({ name: 'id', description: 'Habit ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Habit updated successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Habit not found',
    })
    update(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() updateHabitDto: UpdateHabitDto,
    ) {
        return this.habitsService.update(user.id, id, updateHabitDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a habit' })
    @ApiParam({ name: 'id', description: 'Habit ID' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Habit deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Habit not found',
    })
    remove(@CurrentUser() user: User, @Param('id') id: string) {
        return this.habitsService.remove(user.id, id);
    }

    @Post(':id/complete')
    @ApiOperation({ summary: 'Mark habit as completed' })
    @ApiParam({ name: 'id', description: 'Habit ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Habit marked as completed',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Habit not found',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Habit already completed today',
    })
    async complete(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() completeHabitDto: CompleteHabitDto,
    ) {
        const result = await this.habitsService.completeHabit(user.id, id, completeHabitDto);
        return {
            success: true,
            data: result
        };
    }

    @Delete(':id/complete')
    @ApiOperation({ summary: 'Unmark habit completion' })
    @ApiParam({ name: 'id', description: 'Habit ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Habit completion removed',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Habit or completion not found',
    })
    uncomplete(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Query('date') date?: string,
    ) {
        return this.habitsService.uncompleteHabit(user.id, id, date);
    }

    @Get(':id/completions')
    @ApiOperation({ summary: 'Get habit completion history' })
    @ApiParam({ name: 'id', description: 'Habit ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Completion history retrieved successfully',
    })
    getCompletions(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.habitsService.getHabitCompletions(user.id, id, startDate, endDate);
    }
}