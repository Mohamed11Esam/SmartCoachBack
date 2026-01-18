import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Request, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeviceTokenDto } from './dto/device-token.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('device-token')
    @ApiOperation({ summary: 'Register device token for push notifications' })
    @ApiResponse({ status: 200, description: 'Token registered successfully' })
    async registerDeviceToken(@Request() req, @Body() body: DeviceTokenDto) {
        await this.notificationsService.registerDeviceToken(req.user.userId, body.token);
        return { message: 'Device token registered' };
    }

    @Delete('device-token')
    @ApiOperation({ summary: 'Remove device token' })
    @ApiResponse({ status: 200, description: 'Token removed successfully' })
    async removeDeviceToken(@Request() req, @Body() body: DeviceTokenDto) {
        await this.notificationsService.removeDeviceToken(req.user.userId, body.token);
        return { message: 'Device token removed' };
    }

    @Get()
    @ApiOperation({ summary: 'Get user notifications' })
    @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Notifications returned' })
    async findAll(@Request() req, @Query('unreadOnly') unreadOnly?: string) {
        const isUnreadOnly = unreadOnly === 'true';
        return this.notificationsService.findByUserId(req.user.userId, isUnreadOnly);
    }

    @Get('count')
    @ApiOperation({ summary: 'Get unread notification count' })
    @ApiResponse({ status: 200, description: 'Count returned' })
    async getUnreadCount(@Request() req) {
        const count = await this.notificationsService.countUnread(req.user.userId);
        return { count };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 200, description: 'Notification marked as read' })
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ status: 200, description: 'All notifications marked as read' })
    async markAllAsRead(@Request() req) {
        await this.notificationsService.markAllAsRead(req.user.userId);
        return { message: 'All notifications marked as read' };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    @ApiResponse({ status: 200, description: 'Notification deleted' })
    async delete(@Param('id') id: string) {
        await this.notificationsService.delete(id);
        return { message: 'Notification deleted' };
    }
}
