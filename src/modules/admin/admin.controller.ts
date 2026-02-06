import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('stats/users')
    @ApiOperation({ summary: 'Get user statistics' })
    async getUserStats() {
        return this.adminService.getUserStats();
    }

    @Get('stats/coaches')
    @ApiOperation({ summary: 'Get coach statistics' })
    async getCoachStats() {
        return this.adminService.getCoachStats();
    }

    @Get('stats/revenue')
    @ApiOperation({ summary: 'Get revenue statistics' })
    async getRevenueStats() {
        return this.adminService.getRevenueStats();
    }

    @Get('stats/sessions')
    @ApiOperation({ summary: 'Get session statistics' })
    async getSessionStats() {
        return this.adminService.getSessionStats();
    }

    @Get('stats/content')
    @ApiOperation({ summary: 'Get content statistics (workouts, meals, products)' })
    async getContentStats() {
        return this.adminService.getContentStats();
    }

    @Get('charts/revenue')
    @ApiOperation({ summary: 'Get revenue chart data' })
    @ApiQuery({ name: 'period', enum: ['week', 'month'], required: false })
    async getRevenueChartData(@Query('period') period?: 'week' | 'month') {
        return this.adminService.getRevenueChartData(period || 'week');
    }

    @Get('charts/users')
    @ApiOperation({ summary: 'Get new users chart data' })
    @ApiQuery({ name: 'period', enum: ['week', 'month'], required: false })
    async getNewUsersChartData(@Query('period') period?: 'week' | 'month') {
        return this.adminService.getNewUsersChartData(period || 'week');
    }

    @Get('activity')
    @ApiOperation({ summary: 'Get recent activity feed' })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of activities to return (default 10)' })
    async getRecentActivity(@Query('limit') limit?: string) {
        return this.adminService.getRecentActivity(limit ? parseInt(limit) : 10);
    }
}
