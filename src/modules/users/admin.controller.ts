import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminController {
    constructor(
        private readonly usersService: UsersService,
        private readonly analyticsService: AnalyticsService,
    ) {}

    @Get('dashboard')
    async getDashboardStats() {
        return this.analyticsService.getDashboardStats();
    }

    @Get('dashboard/revenue')
    async getRevenueChart(@Query('period') period: '7d' | '30d' = '7d') {
        return this.analyticsService.getRevenueChart(period);
    }

    @Get('dashboard/users-growth')
    async getNewUsersChart(@Query('period') period: '7d' | '30d' = '7d') {
        return this.analyticsService.getNewUsersChart(period);
    }
}
