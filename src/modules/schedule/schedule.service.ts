import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimeSlot, TimeSlotDocument } from './schemas/time-slot.schema';
import { Session, SessionDocument } from './schemas/session.schema';
import {
    CreateTimeSlotDto,
    UpdateTimeSlotDto,
    BookSessionDto,
    UpdateSessionDto,
} from './dto/schedule.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ScheduleService {
    constructor(
        @InjectModel(TimeSlot.name) private timeSlotModel: Model<TimeSlotDocument>,
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    // ══════════════════════════════════════════════════════════════════════════════
    // TIME SLOTS (Coach manages their availability)
    // ══════════════════════════════════════════════════════════════════════════════

    async createTimeSlot(coachId: string, dto: CreateTimeSlotDto): Promise<TimeSlotDocument> {
        // Validate time range
        if (dto.startTime >= dto.endTime) {
            throw new BadRequestException('End time must be after start time');
        }

        // Check for overlapping slots on the same day
        const existingSlots = await this.timeSlotModel.find({
            coachId,
            dayOfWeek: dto.dayOfWeek,
            isAvailable: true,
        });

        for (const slot of existingSlots) {
            if (this.timesOverlap(dto.startTime, dto.endTime, slot.startTime, slot.endTime)) {
                throw new BadRequestException('This time slot overlaps with an existing slot');
            }
        }

        const timeSlot = new this.timeSlotModel({
            coachId,
            ...dto,
        });

        return timeSlot.save();
    }

    async getCoachTimeSlots(coachId: string): Promise<TimeSlotDocument[]> {
        return this.timeSlotModel
            .find({ coachId })
            .sort({ dayOfWeek: 1, startTime: 1 })
            .exec();
    }

    async updateTimeSlot(
        coachId: string,
        slotId: string,
        dto: UpdateTimeSlotDto,
    ): Promise<TimeSlotDocument> {
        const slot = await this.timeSlotModel.findById(slotId);

        if (!slot) {
            throw new NotFoundException('Time slot not found');
        }

        if (slot.coachId.toString() !== coachId) {
            throw new ForbiddenException('You can only update your own time slots');
        }

        Object.assign(slot, dto);
        return slot.save();
    }

    async deleteTimeSlot(coachId: string, slotId: string): Promise<void> {
        const slot = await this.timeSlotModel.findById(slotId);

        if (!slot) {
            throw new NotFoundException('Time slot not found');
        }

        if (slot.coachId.toString() !== coachId) {
            throw new ForbiddenException('You can only delete your own time slots');
        }

        // Check if there are future sessions using this slot
        const futureSessions = await this.sessionModel.countDocuments({
            timeSlotId: slotId,
            scheduledDate: { $gte: new Date() },
            status: { $in: ['scheduled', 'confirmed'] },
        });

        if (futureSessions > 0) {
            throw new BadRequestException(
                'Cannot delete this slot as there are upcoming sessions. Cancel the sessions first.',
            );
        }

        await this.timeSlotModel.findByIdAndDelete(slotId);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // AVAILABILITY (Clients view coach availability)
    // ══════════════════════════════════════════════════════════════════════════════

    async getCoachAvailability(
        coachId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<{ date: string; slots: any[] }[]> {
        // Get coach's recurring time slots
        const recurringSlots = await this.timeSlotModel.find({
            coachId,
            isRecurring: true,
            isAvailable: true,
        });

        // Get one-time slots in the date range
        const oneTimeSlots = await this.timeSlotModel.find({
            coachId,
            isRecurring: false,
            isAvailable: true,
            specificDate: { $gte: startDate, $lte: endDate },
        });

        // Get booked sessions in the date range
        const bookedSessions = await this.sessionModel.find({
            coachId,
            scheduledDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
        });

        // Build availability for each day
        const availability: { date: string; slots: any[] }[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            const dateStr = currentDate.toISOString().split('T')[0];

            // Get recurring slots for this day of week
            const daySlots = recurringSlots
                .filter(slot => slot.dayOfWeek === dayOfWeek)
                .map(slot => ({
                    slotId: slot._id,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    duration: slot.duration,
                    sessionType: slot.sessionType,
                    isBooked: false,
                }));

            // Add one-time slots for this specific date
            oneTimeSlots
                .filter(slot => slot.specificDate?.toISOString().split('T')[0] === dateStr)
                .forEach(slot => {
                    daySlots.push({
                        slotId: slot._id,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        duration: slot.duration,
                        sessionType: slot.sessionType,
                        isBooked: false,
                    });
                });

            // Mark booked slots
            bookedSessions
                .filter(session => session.scheduledDate.toISOString().split('T')[0] === dateStr)
                .forEach(session => {
                    const slotIndex = daySlots.findIndex(
                        slot => slot.startTime === session.startTime && slot.endTime === session.endTime,
                    );
                    if (slotIndex !== -1) {
                        daySlots[slotIndex].isBooked = true;
                    }
                });

            // Sort by start time
            daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

            availability.push({
                date: dateStr,
                slots: daySlots,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return availability;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SESSIONS (Booking and management)
    // ══════════════════════════════════════════════════════════════════════════════

    async bookSession(clientId: string, dto: BookSessionDto): Promise<SessionDocument> {
        const scheduledDate = new Date(dto.scheduledDate);

        // Check if the slot is available
        const existingSession = await this.sessionModel.findOne({
            coachId: dto.coachId,
            scheduledDate: {
                $gte: new Date(scheduledDate.setHours(0, 0, 0, 0)),
                $lt: new Date(scheduledDate.setHours(23, 59, 59, 999)),
            },
            startTime: dto.startTime,
            status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
        });

        if (existingSession) {
            throw new BadRequestException('This time slot is already booked');
        }

        // Check if the requested time matches a coach's available slot
        const dayOfWeek = new Date(dto.scheduledDate).getDay();
        const availableSlot = await this.timeSlotModel.findOne({
            coachId: dto.coachId,
            dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
            isAvailable: true,
        });

        if (!availableSlot) {
            throw new BadRequestException('The requested time is not in the coach\'s available slots');
        }

        const session = new this.sessionModel({
            coachId: dto.coachId,
            clientId,
            timeSlotId: dto.timeSlotId || availableSlot._id,
            scheduledDate: new Date(dto.scheduledDate),
            startTime: dto.startTime,
            endTime: dto.endTime,
            duration: availableSlot.duration,
            sessionType: dto.sessionType || availableSlot.sessionType,
            title: dto.title,
            notes: dto.notes,
            status: 'scheduled',
        });

        const savedSession = await session.save();

        // Notify coach about new booking
        try {
            const client = await this.usersService.findById(clientId);
            if (client) {
                const clientName = `${client.firstName} ${client.lastName}`;
                const dateStr = new Date(dto.scheduledDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                });
                await this.notificationsService.notifySessionBooked(
                    dto.coachId,
                    clientName,
                    savedSession._id.toString(),
                    dateStr,
                    dto.startTime,
                );
            }
        } catch (error) {
            console.error('Failed to send session booked notification:', error);
        }

        return savedSession;
    }

    async getClientSessions(
        clientId: string,
        status?: string,
        upcoming?: boolean,
    ): Promise<SessionDocument[]> {
        const query: any = { clientId };

        if (status) {
            query.status = status;
        }

        if (upcoming) {
            query.scheduledDate = { $gte: new Date() };
            query.status = { $in: ['scheduled', 'confirmed'] };
        }

        return this.sessionModel
            .find(query)
            .populate('coachId', 'firstName lastName photoUrl')
            .sort({ scheduledDate: 1, startTime: 1 })
            .exec();
    }

    async getCoachSessions(
        coachId: string,
        status?: string,
        upcoming?: boolean,
        date?: string,
    ): Promise<SessionDocument[]> {
        const query: any = { coachId };

        if (status) {
            query.status = status;
        }

        if (upcoming) {
            query.scheduledDate = { $gte: new Date() };
            query.status = { $in: ['scheduled', 'confirmed'] };
        }

        if (date) {
            const targetDate = new Date(date);
            query.scheduledDate = {
                $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
            };
        }

        return this.sessionModel
            .find(query)
            .populate('clientId', 'firstName lastName photoUrl fitnessLevel')
            .sort({ scheduledDate: 1, startTime: 1 })
            .exec();
    }

    async getSessionById(sessionId: string, userId: string): Promise<SessionDocument> {
        const session = await this.sessionModel
            .findById(sessionId)
            .populate('coachId', 'firstName lastName photoUrl email')
            .populate('clientId', 'firstName lastName photoUrl email fitnessLevel')
            .exec();

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Check if user is part of this session
        if (
            session.coachId._id.toString() !== userId &&
            session.clientId._id.toString() !== userId
        ) {
            throw new ForbiddenException('You are not part of this session');
        }

        return session;
    }

    async updateSession(
        sessionId: string,
        userId: string,
        userRole: string,
        dto: UpdateSessionDto,
    ): Promise<SessionDocument> {
        const session = await this.sessionModel.findById(sessionId);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        const isCoach = session.coachId.toString() === userId;
        const isClient = session.clientId.toString() === userId;

        if (!isCoach && !isClient) {
            throw new ForbiddenException('You are not part of this session');
        }

        // Handle status changes
        if (dto.status === 'canceled') {
            session.status = 'canceled';
            session.canceledAt = new Date();
            session.canceledBy = isCoach ? 'coach' : 'client';
            session.cancelReason = dto.cancelReason;
        } else if (dto.status === 'confirmed' && isCoach) {
            session.status = 'confirmed';
        } else if (dto.status === 'completed' && isCoach) {
            session.status = 'completed';
            session.completedAt = new Date();
        } else if (dto.status === 'in-progress' && isCoach) {
            session.status = 'in-progress';
        } else if (dto.status === 'no-show' && isCoach) {
            session.status = 'no-show';
        }

        // Update other fields
        if (dto.notes !== undefined) session.notes = dto.notes;
        if (dto.meetingLink !== undefined && isCoach) session.meetingLink = dto.meetingLink;
        if (dto.location !== undefined && isCoach) session.location = dto.location;
        if (dto.coachNotes !== undefined && isCoach) session.coachNotes = dto.coachNotes;
        if (dto.clientNotes !== undefined && isClient) session.clientNotes = dto.clientNotes;

        const savedSession = await session.save();

        // Send notification for session confirmation
        if (dto.status === 'confirmed' && isCoach) {
            try {
                const coach = await this.usersService.findById(userId);
                if (coach) {
                    const coachName = `${coach.firstName} ${coach.lastName}`;
                    const dateStr = session.scheduledDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                    });
                    await this.notificationsService.notifySessionConfirmed(
                        session.clientId.toString(),
                        coachName,
                        savedSession._id.toString(),
                        dateStr,
                        session.startTime,
                    );
                }
            } catch (error) {
                console.error('Failed to send session confirmed notification:', error);
            }
        }

        return savedSession;
    }

    async cancelSession(
        sessionId: string,
        userId: string,
        reason?: string,
    ): Promise<SessionDocument> {
        const session = await this.sessionModel.findById(sessionId);

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        const isCoach = session.coachId.toString() === userId;
        const isClient = session.clientId.toString() === userId;

        if (!isCoach && !isClient) {
            throw new ForbiddenException('You are not part of this session');
        }

        if (!['scheduled', 'confirmed'].includes(session.status)) {
            throw new BadRequestException('This session cannot be canceled');
        }

        session.status = 'canceled';
        session.canceledAt = new Date();
        session.canceledBy = isCoach ? 'coach' : 'client';
        session.cancelReason = reason;

        const savedSession = await session.save();

        // Notify the other party about cancellation
        try {
            const otherUserId = isCoach
                ? session.clientId.toString()
                : session.coachId.toString();
            const currentUser = await this.usersService.findById(userId);

            if (currentUser) {
                const userName = `${currentUser.firstName} ${currentUser.lastName}`;
                const dateStr = session.scheduledDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                });
                await this.notificationsService.notifySessionCanceled(
                    otherUserId,
                    userName,
                    savedSession._id.toString(),
                    dateStr,
                    session.startTime,
                    isCoach ? 'coach' : 'client',
                    reason,
                );
            }
        } catch (error) {
            console.error('Failed to send session canceled notification:', error);
        }

        return savedSession;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CALENDAR & STATISTICS
    // ══════════════════════════════════════════════════════════════════════════════

    async getCoachCalendar(coachId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const sessions = await this.sessionModel
            .find({
                coachId,
                scheduledDate: { $gte: startDate, $lte: endDate },
            })
            .populate('clientId', 'firstName lastName photoUrl')
            .sort({ scheduledDate: 1, startTime: 1 })
            .exec();

        // Group by date
        const calendar: Record<string, any[]> = {};

        sessions.forEach(session => {
            const dateStr = session.scheduledDate.toISOString().split('T')[0];
            if (!calendar[dateStr]) {
                calendar[dateStr] = [];
            }
            calendar[dateStr].push({
                _id: session._id,
                client: session.clientId,
                startTime: session.startTime,
                endTime: session.endTime,
                title: session.title,
                status: session.status,
                sessionType: session.sessionType,
            });
        });

        return calendar;
    }

    async getCoachScheduleStats(coachId: string) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        // Sessions this week
        const weekSessions = await this.sessionModel.find({
            coachId,
            scheduledDate: { $gte: startOfWeek, $lt: endOfWeek },
        });

        const totalThisWeek = weekSessions.length;
        const completedThisWeek = weekSessions.filter(s => s.status === 'completed').length;
        const upcomingThisWeek = weekSessions.filter(
            s => ['scheduled', 'confirmed'].includes(s.status) && s.scheduledDate >= now,
        ).length;
        const canceledThisWeek = weekSessions.filter(s => s.status === 'canceled').length;

        // Today's sessions
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const todaySessions = await this.sessionModel
            .find({
                coachId,
                scheduledDate: { $gte: startOfToday, $lte: endOfToday },
                status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
            })
            .populate('clientId', 'firstName lastName photoUrl')
            .sort({ startTime: 1 })
            .exec();

        // Next session
        const nextSession = await this.sessionModel
            .findOne({
                coachId,
                scheduledDate: { $gte: now },
                status: { $in: ['scheduled', 'confirmed'] },
            })
            .populate('clientId', 'firstName lastName photoUrl')
            .sort({ scheduledDate: 1, startTime: 1 })
            .exec();

        return {
            thisWeek: {
                total: totalThisWeek,
                completed: completedThisWeek,
                upcoming: upcomingThisWeek,
                canceled: canceledThisWeek,
            },
            today: {
                sessions: todaySessions,
                count: todaySessions.length,
            },
            nextSession,
        };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════════════

    private timesOverlap(
        start1: string,
        end1: string,
        start2: string,
        end2: string,
    ): boolean {
        return start1 < end2 && start2 < end1;
    }
}
