import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SessionReminderTask {
    private readonly logger = new Logger(SessionReminderTask.name);

    constructor(
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
        private readonly notificationsService: NotificationsService,
    ) {}

    // Run every 5 minutes to check for upcoming sessions
    @Cron(CronExpression.EVERY_5_MINUTES)
    async handleSessionReminders() {
        this.logger.debug('Checking for upcoming session reminders...');

        const now = new Date();

        // Check for sessions starting in ~60 minutes (55-65 min window)
        await this.sendRemindersForTimeWindow(now, 55, 65, 60);

        // Check for sessions starting in ~30 minutes (25-35 min window)
        await this.sendRemindersForTimeWindow(now, 25, 35, 30);

        // Check for sessions starting in ~5 minutes (0-10 min window) - "Starting Now"
        await this.sendStartingNowReminders(now);
    }

    private async sendRemindersForTimeWindow(
        now: Date,
        minMinutes: number,
        maxMinutes: number,
        reminderMinutes: number,
    ) {
        const minTime = new Date(now.getTime() + minMinutes * 60 * 1000);
        const maxTime = new Date(now.getTime() + maxMinutes * 60 * 1000);

        // Find sessions in this time window that haven't been reminded
        const sessions = await this.sessionModel
            .find({
                status: { $in: ['scheduled', 'confirmed'] },
                scheduledDate: {
                    $gte: new Date(now.toDateString()),
                    $lte: new Date(now.toDateString()),
                },
                [`reminder${reminderMinutes}Sent`]: { $ne: true },
            })
            .populate('coachId', 'firstName lastName')
            .populate('clientId', 'firstName lastName')
            .exec();

        for (const session of sessions) {
            // Calculate session start time
            const sessionDate = new Date(session.scheduledDate);
            const [hours, minutes] = session.startTime.split(':').map(Number);
            sessionDate.setHours(hours, minutes, 0, 0);

            // Check if session falls within our reminder window
            if (sessionDate >= minTime && sessionDate <= maxTime) {
                try {
                    const coach = session.coachId as any;
                    const client = session.clientId as any;

                    // Notify client
                    await this.notificationsService.notifySessionReminder(
                        client._id.toString(),
                        `${coach.firstName} ${coach.lastName}`,
                        session._id.toString(),
                        reminderMinutes,
                    );

                    // Notify coach
                    await this.notificationsService.notifySessionReminder(
                        coach._id.toString(),
                        `${client.firstName} ${client.lastName}`,
                        session._id.toString(),
                        reminderMinutes,
                    );

                    // Mark reminder as sent
                    await this.sessionModel.findByIdAndUpdate(session._id, {
                        [`reminder${reminderMinutes}Sent`]: true,
                    });

                    this.logger.log(
                        `Sent ${reminderMinutes}-minute reminder for session ${session._id}`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Failed to send reminder for session ${session._id}:`,
                        error,
                    );
                }
            }
        }
    }

    private async sendStartingNowReminders(now: Date) {
        const maxTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

        const sessions = await this.sessionModel
            .find({
                status: { $in: ['scheduled', 'confirmed'] },
                scheduledDate: {
                    $gte: new Date(now.toDateString()),
                    $lte: new Date(now.toDateString()),
                },
                startingNowSent: { $ne: true },
            })
            .populate('coachId', 'firstName lastName')
            .populate('clientId', 'firstName lastName')
            .exec();

        for (const session of sessions) {
            // Calculate session start time
            const sessionDate = new Date(session.scheduledDate);
            const [hours, minutes] = session.startTime.split(':').map(Number);
            sessionDate.setHours(hours, minutes, 0, 0);

            // Check if session is starting within 10 minutes
            if (sessionDate >= now && sessionDate <= maxTime) {
                try {
                    const coach = session.coachId as any;
                    const client = session.clientId as any;

                    // Notify client
                    await this.notificationsService.notifySessionStarting(
                        client._id.toString(),
                        `${coach.firstName} ${coach.lastName}`,
                        session._id.toString(),
                        session.meetingLink,
                    );

                    // Notify coach
                    await this.notificationsService.notifySessionStarting(
                        coach._id.toString(),
                        `${client.firstName} ${client.lastName}`,
                        session._id.toString(),
                        session.meetingLink,
                    );

                    // Mark as sent and update status
                    await this.sessionModel.findByIdAndUpdate(session._id, {
                        startingNowSent: true,
                        status: 'in-progress',
                    });

                    this.logger.log(
                        `Sent starting-now notification for session ${session._id}`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Failed to send starting-now notification for session ${session._id}:`,
                        error,
                    );
                }
            }
        }
    }

    // Run daily at midnight to mark no-show sessions
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async markNoShowSessions() {
        this.logger.debug('Checking for no-show sessions...');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);

        // Find sessions from yesterday that are still scheduled/confirmed (not completed/canceled)
        const result = await this.sessionModel.updateMany(
            {
                scheduledDate: { $gte: yesterday, $lte: endOfYesterday },
                status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
            },
            {
                status: 'no-show',
            },
        );

        if (result.modifiedCount > 0) {
            this.logger.log(`Marked ${result.modifiedCount} sessions as no-show`);
        }
    }
}
