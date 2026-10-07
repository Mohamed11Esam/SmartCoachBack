import { Injectable } from '@nestjs/common';
import { ProgressLogsRepository } from './progress-logs.repository';
import { GoalRepository } from './goal.repository';
import { MetricLogRepository } from './metric-log.repository';
import { CreateProgressLogDto, WorkoutSessionLogDto } from './dto/create-progress-log.dto';
import { GoalDocument, GoalStatus } from './schemas/goal.schema';
import { MetricLogDocument } from './schemas/metric-log.schema';

@Injectable()
export class ProgressLogsService {
    constructor(
        private readonly progressLogsRepository: ProgressLogsRepository,
        private readonly goalRepository: GoalRepository,
        private readonly metricLogRepository: MetricLogRepository,
    ) { }

    async create(userId: string, dto: CreateProgressLogDto) {
        const volume = dto.volume || ((dto.sets || 1) * (dto.reps || 0) * (dto.weight || 0));
        return this.progressLogsRepository.create({ ...dto, volume, userId });
    }

    async logWorkoutSession(userId: string, dto: WorkoutSessionLogDto) {
        const date = dto.date ? new Date(dto.date) : new Date();
        const savedLogs: any[] = [];
        let calculatedTotalVolume = 0;

        for (const ex of dto.completedExercises) {
            const exerciseVolume = (ex.sets || 1) * (ex.reps || 0) * (ex.weight || 0);
            calculatedTotalVolume += exerciseVolume;

            const log = await this.progressLogsRepository.create({
                userId,
                workoutId: dto.workoutId,
                workoutTitle: dto.workoutTitle,
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                volume: exerciseVolume,
                rpe: ex.rpe || 8.0,
                durationMinutes: dto.durationMinutes,
                caloriesBurned: dto.caloriesBurned,
                completed: ex.completed !== false,
                notes: ex.notes,
                date,
            } as any);
            savedLogs.push(log);
        }

        const totalVolume = dto.totalVolume || calculatedTotalVolume;

        return {
            success: true,
            totalVolume,
            durationMinutes: dto.durationMinutes || 0,
            caloriesBurned: dto.caloriesBurned || 0,
            logsCount: savedLogs.length,
            logs: savedLogs,
        };
    }

    async getVolumeHistory(userId: string) {
        const logs = await this.progressLogsRepository.findByUserId(userId);
        
        // Group logs by date (YYYY-MM-DD)
        const dateMap = new Map<string, { volume: number; workoutsCount: number; caloriesBurned: number }>();

        for (const log of logs) {
            const dateStr = new Date(log.date).toISOString().split('T')[0];
            const current = dateMap.get(dateStr) || { volume: 0, workoutsCount: 0, caloriesBurned: 0 };
            current.volume += (log as any).volume || ((log.sets || 1) * (log.reps || 0) * (log.weight || 0));
            current.caloriesBurned = Math.max(current.caloriesBurned, (log as any).caloriesBurned || 0);
            current.workoutsCount += 1;
            dateMap.set(dateStr, current);
        }

        const result = Array.from(dateMap.entries()).map(([date, data]) => ({
            date,
            volume: data.volume,
            workoutsCount: Math.ceil(data.workoutsCount / 4) || 1, // approximate sessions
            caloriesBurned: data.caloriesBurned || 350,
        })).sort((a, b) => a.date.localeCompare(b.date));

        return result;
    }

    async findByUserId(userId: string) {
        return this.progressLogsRepository.findByUserId(userId);
    }

    async findByPlanId(planId: string) {
        return this.progressLogsRepository.findByPlanId(planId);
    }

    async findOne(id: string) {
        return this.progressLogsRepository.findOneById(id);
    }

    async getStats(userId: string) {
        const logs = await this.progressLogsRepository.findByUserId(userId);
        const totalWorkouts = logs.length;
        const completedWorkouts = logs.filter(log => log.completed).length;

        // Calculate streak based on consecutive days
        let currentStreak = 0;
        const sortedLogs = logs
            .filter(log => log.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (sortedLogs.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let checkDate = today;

            for (const log of sortedLogs) {
                const logDate = new Date(log.date);
                logDate.setHours(0, 0, 0, 0);

                const diffDays = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 1) {
                    currentStreak++;
                    checkDate = logDate;
                } else {
                    break;
                }
            }
        }

        return {
            totalWorkouts,
            completedWorkouts,
            currentStreak
        };
    }

    async logMetrics(userId: string, data: any): Promise<MetricLogDocument> {
        return this.metricLogRepository.create({
            ...data,
            userId,
            date: data.date || new Date(),
        });
    }

    async getMetrics(userId: string): Promise<MetricLogDocument[]> {
        return this.metricLogRepository.findByUserId(userId);
    }

    async createGoal(userId: string, goalData: any): Promise<GoalDocument> {
        return this.goalRepository.create({
            ...goalData,
            userId,
            status: GoalStatus.IN_PROGRESS,
            currentValue: goalData.currentValue || 0,
        });
    }

    async getGoals(userId: string): Promise<GoalDocument[]> {
        return this.goalRepository.findByUserId(userId);
    }

    async updateGoalProgress(goalId: string, progress: number): Promise<GoalDocument> {
        const goal = await this.goalRepository.findOneById(goalId);

        // Check if goal is completed
        let status = goal.status;
        if (progress >= goal.targetValue) {
            status = GoalStatus.COMPLETED;
        }

        return this.goalRepository.update(goalId, {
            currentValue: progress,
            status,
        });
    }
}

