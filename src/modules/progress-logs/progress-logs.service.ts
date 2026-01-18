import { Injectable } from '@nestjs/common';
import { ProgressLogsRepository } from './progress-logs.repository';
import { GoalRepository } from './goal.repository';
import { MetricLogRepository } from './metric-log.repository';
import { CreateProgressLogDto } from './dto/create-progress-log.dto';
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
        return this.progressLogsRepository.create({ ...dto, userId });
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

