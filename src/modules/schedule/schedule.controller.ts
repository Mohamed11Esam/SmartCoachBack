import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ScheduleService } from './schedule.service';
import {
    CreateTimeSlotDto,
    UpdateTimeSlotDto,
    BookSessionDto,
    UpdateSessionDto,
} from './dto/schedule.dto';

@ApiTags('Schedule')
@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ScheduleController {
    constructor(private readonly scheduleService: ScheduleService) {}

    // ══════════════════════════════════════════════════════════════════════════════
    // TIME SLOTS - Coach manages availability
    // ══════════════════════════════════════════════════════════════════════════════

    @Post('slots')
    @Roles('Coach')
    @ApiOperation({ summary: 'Create a time slot (Coach)' })
    async createTimeSlot(@Request() req, @Body() dto: CreateTimeSlotDto) {
        return this.scheduleService.createTimeSlot(req.user.userId, dto);
    }

    @Get('slots/my')
    @Roles('Coach')
    @ApiOperation({ summary: 'Get my time slots (Coach)' })
    async getMyTimeSlots(@Request() req) {
        return this.scheduleService.getCoachTimeSlots(req.user.userId);
    }

    @Put('slots/:slotId')
    @Roles('Coach')
    @ApiOperation({ summary: 'Update a time slot (Coach)' })
    async updateTimeSlot(
        @Request() req,
        @Param('slotId') slotId: string,
        @Body() dto: UpdateTimeSlotDto,
    ) {
        return this.scheduleService.updateTimeSlot(req.user.userId, slotId, dto);
    }

    @Delete('slots/:slotId')
    @Roles('Coach')
    @ApiOperation({ summary: 'Delete a time slot (Coach)' })
    async deleteTimeSlot(@Request() req, @Param('slotId') slotId: string) {
        await this.scheduleService.deleteTimeSlot(req.user.userId, slotId);
        return { message: 'Time slot deleted' };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // AVAILABILITY - Clients view coach availability
    // ══════════════════════════════════════════════════════════════════════════════

    @Get('availability/:coachId')
    @ApiOperation({ summary: 'Get coach availability for a date range' })
    @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
    async getCoachAvailability(
        @Param('coachId') coachId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.scheduleService.getCoachAvailability(
            coachId,
            new Date(startDate),
            new Date(endDate),
        );
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SESSIONS - Booking and management
    // ══════════════════════════════════════════════════════════════════════════════

    @Post('sessions/book')
    @ApiOperation({ summary: 'Book a session with a coach (Customer)' })
    async bookSession(@Request() req, @Body() dto: BookSessionDto) {
        return this.scheduleService.bookSession(req.user.userId, dto);
    }

    @Get('sessions/my')
    @ApiOperation({ summary: 'Get my sessions (Customer)' })
    @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
    @ApiQuery({ name: 'upcoming', required: false, description: 'Only show upcoming sessions' })
    async getMySessions(
        @Request() req,
        @Query('status') status?: string,
        @Query('upcoming') upcoming?: string,
    ) {
        return this.scheduleService.getClientSessions(
            req.user.userId,
            status,
            upcoming === 'true',
        );
    }

    @Get('sessions/coach')
    @Roles('Coach')
    @ApiOperation({ summary: 'Get sessions as a coach (Coach)' })
    @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
    @ApiQuery({ name: 'upcoming', required: false, description: 'Only show upcoming sessions' })
    @ApiQuery({ name: 'date', required: false, description: 'Filter by specific date (YYYY-MM-DD)' })
    async getCoachSessions(
        @Request() req,
        @Query('status') status?: string,
        @Query('upcoming') upcoming?: string,
        @Query('date') date?: string,
    ) {
        return this.scheduleService.getCoachSessions(
            req.user.userId,
            status,
            upcoming === 'true',
            date,
        );
    }

    @Get('sessions/:sessionId')
    @ApiOperation({ summary: 'Get session details' })
    async getSession(@Request() req, @Param('sessionId') sessionId: string) {
        return this.scheduleService.getSessionById(sessionId, req.user.userId);
    }

    @Put('sessions/:sessionId')
    @ApiOperation({ summary: 'Update a session (status, notes, etc.)' })
    async updateSession(
        @Request() req,
        @Param('sessionId') sessionId: string,
        @Body() dto: UpdateSessionDto,
    ) {
        return this.scheduleService.updateSession(
            sessionId,
            req.user.userId,
            req.user.role,
            dto,
        );
    }

    @Post('sessions/:sessionId/cancel')
    @ApiOperation({ summary: 'Cancel a session' })
    async cancelSession(
        @Request() req,
        @Param('sessionId') sessionId: string,
        @Body() body: { reason?: string },
    ) {
        return this.scheduleService.cancelSession(sessionId, req.user.userId, body.reason);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CALENDAR & STATS - Coach dashboard
    // ══════════════════════════════════════════════════════════════════════════════

    @Get('calendar')
    @Roles('Coach')
    @ApiOperation({ summary: 'Get calendar view for a month (Coach)' })
    @ApiQuery({ name: 'month', required: true, description: 'Month (1-12)' })
    @ApiQuery({ name: 'year', required: true, description: 'Year (e.g., 2024)' })
    async getCalendar(
        @Request() req,
        @Query('month') month: string,
        @Query('year') year: string,
    ) {
        return this.scheduleService.getCoachCalendar(
            req.user.userId,
            parseInt(month),
            parseInt(year),
        );
    }

    @Get('stats')
    @Roles('Coach')
    @ApiOperation({ summary: 'Get schedule statistics (Coach)' })
    async getScheduleStats(@Request() req) {
        return this.scheduleService.getCoachScheduleStats(req.user.userId);
    }
}
