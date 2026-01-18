import { Controller, Get, Post, Body, Param, UseGuards, Put } from '@nestjs/common';
import { ProgressLogsService } from './progress-logs.service';
import { CreateProgressLogDto } from './dto/create-progress-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('progress-logs')
@UseGuards(JwtAuthGuard)
export class ProgressLogsController {
    constructor(private readonly progressLogsService: ProgressLogsService) { }

    @Post()
    create(@CurrentUser() user: any, @Body() dto: CreateProgressLogDto) {
        return this.progressLogsService.create(user.sub, dto);
    }

    @Get('my-logs')
    findMyLogs(@CurrentUser() user: any) {
        return this.progressLogsService.findByUserId(user.sub);
    }

    @Get('stats')
    getStats(@CurrentUser() user: any) {
        return this.progressLogsService.getStats(user.sub);
    }

    @Post('metrics')
    logMetrics(@CurrentUser() user: any, @Body() body: any) {
        return this.progressLogsService.logMetrics(user.sub, body);
    }

    @Get('metrics')
    getMetrics(@CurrentUser() user: any) {
        return this.progressLogsService.getMetrics(user.sub);
    }

    @Post('goals')
    createGoal(@CurrentUser() user: any, @Body() body: any) {
        return this.progressLogsService.createGoal(user.sub, body);
    }

    @Get('goals')
    getGoals(@CurrentUser() user: any) {
        return this.progressLogsService.getGoals(user.sub);
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
