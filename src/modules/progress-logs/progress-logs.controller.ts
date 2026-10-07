import { Controller, Get, Post, Body, Param, UseGuards, Put } from '@nestjs/common';
import { ProgressLogsService } from './progress-logs.service';
import { CreateProgressLogDto, WorkoutSessionLogDto } from './dto/create-progress-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('progress-logs')
@UseGuards(JwtAuthGuard)
export class ProgressLogsController {
    constructor(private readonly progressLogsService: ProgressLogsService) { }

    @Post()
    create(@CurrentUser() user: any, @Body() dto: CreateProgressLogDto) {
        const userId = user.userId || user.sub;
        return this.progressLogsService.create(userId, dto);
    }

    @Post('workout-session')
    logWorkoutSession(@CurrentUser() user: any, @Body() dto: WorkoutSessionLogDto) {
        const userId = user.userId || user.sub;
        return this.progressLogsService.logWorkoutSession(userId, dto);
    }

    @Get('volume-history')
    getVolumeHistory(@CurrentUser() user: any) {
        const userId = user.userId || user.sub;
        return this.progressLogsService.getVolumeHistory(userId);
    }

    @Get('my-logs')
    findMyLogs(@CurrentUser() user: any) {
        const userId = user.userId || user.sub;
        return this.progressLogsService.findByUserId(userId);
    }

    @Get('stats')
    getStats(@CurrentUser() user: any) {
        const userId = user.userId || user.sub;
        return this.progressLogsService.getStats(userId);
    }

    @Post('metrics')
    logMetrics(@CurrentUser() user: any, @Body() body: any) {
        const userId = user.userId || user.sub;
        return this.progressLogsService.logMetrics(userId, body);
    }

    @Get('metrics')
    getMetrics(@CurrentUser() user: any) {
        const userId = user.userId || user.sub;
        return this.progressLogsService.getMetrics(userId);
    }

    @Post('goals')
    createGoal(@CurrentUser() user: any, @Body() body: any) {
        const userId = user.userId || user.sub;
        return this.progressLogsService.createGoal(userId, body);
    }

    @Get('goals')
    getGoals(@CurrentUser() user: any) {
        const userId = user.userId || user.sub;
        return this.progressLogsService.getGoals(userId);
    }

    @Put('goals/:id')
    updateGoal(@Param('id') id: string, @Body() body: { progress: number }) {
        return this.progressLogsService.updateGoalProgress(id, body.progress);
    }

    @Get('plan/:planId')
    findByPlan(@Param('planId') planId: string) {
        return this.progressLogsService.findByPlanId(planId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.progressLogsService.findOne(id);
    }
}
