import { InjectQueue } from '@nestjs/bull';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EventType } from '../events/entities/event.entity';
import { EventsService } from '../events/events.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { SearchTasksDto } from './dto/search-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
    Task,
    TaskSource,
    TaskStatus
} from './entities/task.entity';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectQueue('task-reminders')
        private readonly taskReminderQueue: Queue,
        private readonly eventsService: EventsService,
    ) { }

    async create(
        userId: string,
        createTaskDto: CreateTaskDto,
    ): Promise<Task> {
        const task = this.taskRepository.create({
            ...createTaskDto,
            userId,
            subtasks: createTaskDto.subtasks?.map((st) => ({
                ...st,
                id: uuidv4(),
                completed: false,
            })) || [],
        });

        const savedTask = await this.taskRepository.save(task);

        // Schedule reminder if task has due date
        if (savedTask.dueDate) {
            await this.scheduleReminder(savedTask);
        }

        // Emit event
        await this.eventsService.emit(EventType.TASK_CREATED, {
            taskId: savedTask.id,
            userId,
            title: savedTask.title,
            priority: savedTask.priority,
            dueDate: savedTask.dueDate,
            source: savedTask.source,
        });

        return savedTask;
    }

    async findAll(
        userId: string,
        options?: FindManyOptions<Task>,
    ): Promise<Task[]> {
        return this.taskRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            ...options,
        });
    }

    async findById(id: string, userId: string): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id, userId },
            relations: ['user'],
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        return task;
    }

    async update(
        id: string,
        userId: string,
        updateTaskDto: UpdateTaskDto,
    ): Promise<Task> {
        const task = await this.findById(id, userId);

        // Handle status changes
        if (updateTaskDto.status && updateTaskDto.status !== task.status) {
            await this.handleStatusChange(task, updateTaskDto.status);
        }

        // Handle completed boolean field (frontend compatibility)
        if ('completed' in updateTaskDto) {
            const newStatus = updateTaskDto.completed ? TaskStatus.COMPLETED : TaskStatus.TODO;
            if (newStatus !== task.status) {
                updateTaskDto.status = newStatus;
                await this.handleStatusChange(task, newStatus);
            }
            // Don't pass completed to the entity as it doesn't have this field
            delete updateTaskDto.completed;
        }

        // Handle subtask updates
        if (updateTaskDto.subtasks) {
            updateTaskDto.subtasks = updateTaskDto.subtasks.map((st) => ({
                ...st,
                id: st.id || uuidv4(),
            }));

            // Calculate progress based on subtasks
            const completedSubtasks = updateTaskDto.subtasks.filter(st => st.completed).length;
            const totalSubtasks = updateTaskDto.subtasks.length;

            if (totalSubtasks > 0) {
                updateTaskDto.progressPercentage = (completedSubtasks / totalSubtasks) * 100;
            }
        }

        Object.assign(task, updateTaskDto);
        const updatedTask = await this.taskRepository.save(task);

        // Reschedule reminder if due date changed
        if (updateTaskDto.dueDate && updateTaskDto.dueDate !== task.dueDate) {
            await this.scheduleReminder(updatedTask);
        }

        return updatedTask;
    }

    async markCompleted(id: string, userId: string): Promise<Task> {
        const task = await this.findById(id, userId);

        if (task.status === TaskStatus.COMPLETED) {
            throw new BadRequestException('Task is already completed');
        }

        task.status = TaskStatus.COMPLETED;
        task.completedAt = new Date();
        task.progressPercentage = 100;

        // Mark all subtasks as completed
        task.subtasks = task.subtasks.map((st) => ({
            ...st,
            completed: true,
            completedAt: new Date(),
        }));

        const updatedTask = await this.taskRepository.save(task);

        // Cancel reminder
        await this.cancelReminder(task.id);

        // Emit completion event
        await this.eventsService.emit(EventType.TASK_COMPLETED, {
            taskId: task.id,
            userId,
            title: task.title,
            completedAt: task.completedAt,
            completionTime: task.completionTime,
            priority: task.priority,
        });

        // Handle recurring tasks
        if (task.isRecurring && task.recurringPattern) {
            await this.createRecurringTask(task);
        }

        return updatedTask;
    }

    async search(
        userId: string,
        searchDto: SearchTasksDto,
    ): Promise<Task[]> {
        const queryBuilder = this.taskRepository
            .createQueryBuilder('task')
            .where('task.userId = :userId', { userId });

        if (searchDto.query) {
            queryBuilder.andWhere(
                '(task.title ILIKE :query OR task.description ILIKE :query)',
                { query: `%${searchDto.query}%` },
            );
        }

        if (searchDto.status) {
            queryBuilder.andWhere('task.status = :status', {
                status: searchDto.status,
            });
        }

        if (searchDto.priority) {
            queryBuilder.andWhere('task.priority = :priority', {
                priority: searchDto.priority,
            });
        }

        if (searchDto.tags && searchDto.tags.length > 0) {
            queryBuilder.andWhere('task.tags && :tags', {
                tags: searchDto.tags,
            });
        }

        if (searchDto.dueDateFrom || searchDto.dueDateTo) {
            if (searchDto.dueDateFrom && searchDto.dueDateTo) {
                queryBuilder.andWhere(
                    'task.dueDate BETWEEN :dueDateFrom AND :dueDateTo',
                    {
                        dueDateFrom: searchDto.dueDateFrom,
                        dueDateTo: searchDto.dueDateTo,
                    },
                );
            } else if (searchDto.dueDateFrom) {
                queryBuilder.andWhere('task.dueDate >= :dueDateFrom', {
                    dueDateFrom: searchDto.dueDateFrom,
                });
            } else if (searchDto.dueDateTo) {
                queryBuilder.andWhere('task.dueDate <= :dueDateTo', {
                    dueDateTo: searchDto.dueDateTo,
                });
            }
        }

        if (searchDto.isOverdue) {
            queryBuilder.andWhere('task.dueDate < :now', { now: new Date() })
                .andWhere('task.status != :completedStatus', {
                    completedStatus: TaskStatus.COMPLETED,
                });
        }

        // Ordering
        const orderBy = searchDto.sortBy || 'urgencyScore';
        const orderDirection = searchDto.sortOrder || 'DESC';

        if (orderBy === 'urgencyScore') {
            // Custom ordering by urgency score (would need to be calculated in query)
            queryBuilder.orderBy('task.priority', 'DESC')
                .addOrderBy('task.dueDate', 'ASC')
                .addOrderBy('task.createdAt', 'DESC');
        } else {
            queryBuilder.orderBy(`task.${orderBy}`, orderDirection as 'ASC' | 'DESC');
        }

        return queryBuilder
            .limit(searchDto.limit || 50)
            .offset(searchDto.offset || 0)
            .getMany();
    }

    async getUpcomingTasks(userId: string, days = 7): Promise<Task[]> {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        return this.taskRepository.find({
            where: {
                userId,
                status: TaskStatus.TODO,
                dueDate: Between(new Date(), endDate),
            },
            order: { dueDate: 'ASC' },
        });
    }

    async getOverdueTasks(userId: string): Promise<Task[]> {
        return this.taskRepository.find({
            where: {
                userId,
                status: TaskStatus.TODO,
            },
            order: { dueDate: 'ASC' },
        }).then((tasks) => tasks.filter(task => task.isOverdue));
    }

    async remove(id: string, userId: string): Promise<void> {
        const task = await this.findById(id, userId);

        // Cancel reminder
        await this.cancelReminder(task.id);

        await this.taskRepository.softDelete(id);
    }

    private async handleStatusChange(
        task: Task,
        newStatus: TaskStatus,
    ): Promise<void> {
        const oldStatus = task.status;

        if (newStatus === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
            task.completedAt = new Date();
        }

        if (newStatus !== TaskStatus.COMPLETED && oldStatus === TaskStatus.COMPLETED) {
            task.completedAt = null;
        }
    }

    private async createRecurringTask(parentTask: Task): Promise<void> {
        if (!parentTask.recurringPattern) return;

        const { type, interval, endDate } = parentTask.recurringPattern;

        let nextDueDate = new Date(parentTask.dueDate);

        switch (type) {
            case 'daily':
                nextDueDate.setDate(nextDueDate.getDate() + interval);
                break;
            case 'weekly':
                nextDueDate.setDate(nextDueDate.getDate() + (interval * 7));
                break;
            case 'monthly':
                nextDueDate.setMonth(nextDueDate.getMonth() + interval);
                break;
        }

        // Check if we haven't exceeded the end date
        if (endDate && nextDueDate > endDate) {
            return;
        }

        await this.create(parentTask.userId, {
            title: parentTask.title,
            description: parentTask.description,
            priority: parentTask.priority,
            dueDate: nextDueDate,
            estimatedMinutes: parentTask.estimatedMinutes,
            tags: parentTask.tags,
            source: TaskSource.RECURRING,
            parentTaskId: parentTask.id,
            isRecurring: true,
            recurringPattern: parentTask.recurringPattern,
            metadata: {
                ...parentTask.metadata,
                generatedFrom: parentTask.id,
                generatedAt: new Date(),
            },
        });
    }

    private async scheduleReminder(task: Task): Promise<void> {
        if (!task.dueDate) return;

        // Schedule reminder 1 hour before due date
        const reminderTime = new Date(task.dueDate.getTime() - (60 * 60 * 1000));

        if (reminderTime > new Date()) {
            await this.taskReminderQueue.add(
                'send-reminder',
                {
                    taskId: task.id,
                    userId: task.userId,
                },
                {
                    delay: reminderTime.getTime() - Date.now(),
                    jobId: `reminder-${task.id}`,
                },
            );
        }
    }

    private async cancelReminder(taskId: string): Promise<void> {
        try {
            const job = await this.taskReminderQueue.getJob(`reminder-${taskId}`);
            if (job) {
                await job.remove();
            }
        } catch (error) {
            // Job might not exist, which is fine
        }
    }

    async getTaskStats(userId: string): Promise<{
        total: number;
        todo: number;
        inProgress: number;
        completed: number;
        overdue: number;
        completionRate: number;
        averageCompletionTime: number;
    }> {
        const stats = await this.taskRepository
            .createQueryBuilder('task')
            .select('task.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('task.userId = :userId', { userId })
            .groupBy('task.status')
            .getRawMany();

        const result = {
            total: 0,
            todo: 0,
            inProgress: 0,
            completed: 0,
            overdue: 0,
            completionRate: 0,
            averageCompletionTime: 0,
        };

        let totalCompleted = 0;
        stats.forEach((stat) => {
            const count = parseInt(stat.count, 10);
            result.total += count;

            switch (stat.status) {
                case TaskStatus.TODO:
                    result.todo = count;
                    break;
                case TaskStatus.IN_PROGRESS:
                    result.inProgress = count;
                    break;
                case TaskStatus.COMPLETED:
                    result.completed = count;
                    totalCompleted = count;
                    break;
            }
        });

        // Calculate overdue tasks
        const overdueTasks = await this.getOverdueTasks(userId);
        result.overdue = overdueTasks.length;

        // Calculate completion rate
        if (result.total > 0) {
            result.completionRate = (result.completed / result.total) * 100;
        }

        // Calculate average completion time
        if (totalCompleted > 0) {
            const completedTasks = await this.taskRepository.find({
                where: {
                    userId,
                    status: TaskStatus.COMPLETED,
                },
                select: ['createdAt', 'completedAt'],
            });

            const totalTime = completedTasks.reduce((sum, task) => {
                if (task.completedAt) {
                    return sum + (task.completedAt.getTime() - task.createdAt.getTime());
                }
                return sum;
            }, 0);

            result.averageCompletionTime = totalTime / completedTasks.length;
        }

        return result;
    }
}