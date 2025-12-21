import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { HabitCompletion } from './entities/habit-completion.entity';
import { Habit } from './entities/habit.entity';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Habit, HabitCompletion]),
        EventsModule,
        UsersModule,
    ],
    controllers: [HabitsController],
    providers: [HabitsService],
    exports: [HabitsService],
})
export class HabitsModule { }