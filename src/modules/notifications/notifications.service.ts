import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationType, NotificationDocument } from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { FirebaseService } from './firebase.service';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly notificationsRepository: NotificationsRepository,
        private readonly notificationsGateway: NotificationsGateway,
        private readonly emailService: EmailService,
        private readonly usersService: UsersService,
        private readonly firebaseService: FirebaseService,
    ) {}

    async create(
        userId: string,
        type: NotificationType,
        title: string,
        body: string,
        data?: Record<string, any>,
        sendEmail: boolean = false,
        actionUrl?: string,
    ): Promise<NotificationDocument> {
        // Save to database
        const notification = await this.notificationsRepository.create({
            userId,
            type,
            title,
            body,
            data,
            actionUrl,
            read: false,
        });

        // Push via WebSocket (In-app)
        this.notificationsGateway.sendToUser(userId, notification);

        // Get user for email/push preferences
        const user = await this.usersService.findById(userId);

        if (user) {
            const userData = user as any;

            // Send Push Notification (Mobile - System/Background)
            if (userData.pushNotifications && userData.fcmTokens && userData.fcmTokens.length > 0) {
                await this.firebaseService.sendToDevice(
                    userData.fcmTokens,
                    title,
                    body,
                    {
                        type,
                        notificationId: notification._id.toString(),
                        actionUrl,
                        ...data
                    }
                );
            }

            // Send Email
            if (sendEmail && userData.emailNotifications) {
                await this.emailService.sendNotificationEmail(
                    user.email,
                    title,
                    body,
                );
            }
        }

        return notification;
    }

    async registerDeviceToken(userId: string, token: string): Promise<void> {
        await this.usersService.update(userId, {
            $addToSet: { fcmTokens: token }
        } as any);
    }

    async removeDeviceToken(userId: string, token: string): Promise<void> {
        await this.usersService.update(userId, {
            $pull: { fcmTokens: token }
        } as any);
    }

    async findByUserId(userId: string, unreadOnly: boolean = false): Promise<NotificationDocument[]> {
        return this.notificationsRepository.findByUserId(userId, unreadOnly);
    }

    async countUnread(userId: string): Promise<number> {
        return this.notificationsRepository.countUnread(userId);
    }

    async markAsRead(notificationId: string): Promise<NotificationDocument | null> {
        return this.notificationsRepository.markAsRead(notificationId);
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationsRepository.markAllAsRead(userId);
    }

    async delete(notificationId: string): Promise<boolean> {
        return this.notificationsRepository.permanentlyDelete(notificationId);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // MESSAGE NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════════

    async notifyNewMessage(
        userId: string,
        senderName: string,
        conversationId: string,
        messagePreview: string,
    ): Promise<void> {
        const preview = messagePreview.length > 50
            ? messagePreview.substring(0, 50) + '...'
            : messagePreview;

        await this.create(
            userId,
            NotificationType.MESSAGE,
            `New message from ${senderName}`,
            preview,
            { conversationId },
            false,
            `/chat/${conversationId}`,
        );
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // COACH-CLIENT NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════════

    async notifyClientRequest(
        coachId: string,
        clientName: string,
        requestId: string,
    ): Promise<void> {
        await this.create(
            coachId,
            NotificationType.CLIENT_REQUEST,
            'New Client Request',
            `${clientName} wants to train with you`,
            { requestId },
            true,
            `/clients/requests`,
        );
    }

    async notifyRequestAccepted(
        clientId: string,
        coachName: string,
    ): Promise<void> {
        await this.create(
            clientId,
            NotificationType.REQUEST_ACCEPTED,
            'Request Accepted!',
            `${coachName} has accepted your coaching request`,
            {},
            true,
            `/my-coach`,
        );
    }

    async notifyRequestRejected(
        clientId: string,
        coachName: string,
        reason?: string,
    ): Promise<void> {
        await this.create(
            clientId,
            NotificationType.REQUEST_REJECTED,
            'Request Declined',
            reason
                ? `${coachName} declined your request: ${reason}`
                : `${coachName} is not available at this time`,
            {},
            false,
            `/coaches`,
        );
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SESSION NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════════

    async notifySessionBooked(
        coachId: string,
        clientName: string,
        sessionId: string,
        date: string,
        time: string,
    ): Promise<void> {
        await this.create(
            coachId,
            NotificationType.SESSION_BOOKED,
            'New Session Booked',
            `${clientName} booked a session for ${date} at ${time}`,
            { sessionId, date, time },
            true,
            `/schedule/sessions/${sessionId}`,
        );
    }

    async notifySessionConfirmed(
        clientId: string,
        coachName: string,
        sessionId: string,
        date: string,
        time: string,
    ): Promise<void> {
        await this.create(
            clientId,
            NotificationType.SESSION_CONFIRMED,
            'Session Confirmed',
            `Your session with ${coachName} on ${date} at ${time} is confirmed`,
            { sessionId, date, time },
            true,
            `/sessions/${sessionId}`,
        );
    }

    async notifySessionCanceled(
        userId: string,
        otherUserName: string,
        sessionId: string,
        date: string,
        time: string,
        canceledBy: 'coach' | 'client',
        reason?: string,
    ): Promise<void> {
        const message = reason
            ? `Session on ${date} at ${time} was canceled by ${otherUserName}: ${reason}`
            : `Session on ${date} at ${time} was canceled by ${otherUserName}`;

        await this.create(
            userId,
            NotificationType.SESSION_CANCELED,
            'Session Canceled',
            message,
            { sessionId, date, time, canceledBy, reason },
            true,
            `/schedule`,
        );
    }

    async notifySessionReminder(
        userId: string,
        otherUserName: string,
        sessionId: string,
        minutesUntil: number,
    ): Promise<void> {
        const timeText = minutesUntil === 60
            ? '1 hour'
            : minutesUntil === 30
            ? '30 minutes'
            : `${minutesUntil} minutes`;

        await this.create(
            userId,
            NotificationType.SESSION_REMINDER,
            'Session Reminder',
            `Your session with ${otherUserName} starts in ${timeText}`,
            { sessionId, minutesUntil },
            false,
            `/sessions/${sessionId}`,
        );
    }

    async notifySessionStarting(
        userId: string,
        otherUserName: string,
        sessionId: string,
        meetingLink?: string,
    ): Promise<void> {
        await this.create(
            userId,
            NotificationType.SESSION_STARTING,
            'Session Starting Now',
            `Your session with ${otherUserName} is starting`,
            { sessionId, meetingLink },
            false,
            meetingLink || `/sessions/${sessionId}`,
        );
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // PLAN & PROGRESS NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════════

    async notifyPlanAssigned(
        clientId: string,
        coachName: string,
        planId: string,
        planTitle: string,
    ): Promise<void> {
        await this.create(
            clientId,
            NotificationType.PLAN_ASSIGNED,
            'New Training Plan',
            `${coachName} assigned you a new plan: ${planTitle}`,
            { planId, planTitle },
            true,
            `/plans/${planId}`,
        );
    }

    async notifyPlanUpdate(
        clientId: string,
        coachName: string,
        planId: string,
        planTitle: string,
    ): Promise<void> {
        await this.create(
            clientId,
            NotificationType.PLAN_UPDATE,
            'Plan Updated',
            `${coachName} updated your plan: ${planTitle}`,
            { planId, planTitle },
            false,
            `/plans/${planId}`,
        );
    }

    async notifyGoalCompleted(
        userId: string,
        goalType: string,
        goalId: string,
    ): Promise<void> {
        await this.create(
            userId,
            NotificationType.GOAL,
            'Goal Achieved!',
            `Congratulations! You've completed your ${goalType} goal!`,
            { goalId, goalType },
            true,
            `/progress`,
        );
    }

    async notifyProgressMilestone(
        userId: string,
        milestone: string,
        details: string,
    ): Promise<void> {
        await this.create(
            userId,
            NotificationType.PROGRESS_MILESTONE,
            `Milestone: ${milestone}`,
            details,
            { milestone },
            false,
            `/progress`,
        );
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // PAYMENT NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════════

    async notifyPaymentSuccess(
        userId: string,
        amount: number,
        planName: string,
    ): Promise<void> {
        await this.create(
            userId,
            NotificationType.PAYMENT_SUCCESS,
            'Payment Successful',
            `Your payment of ${amount} for ${planName} was successful`,
            { amount, planName },
            true,
            `/subscription`,
        );
    }

    async notifyPaymentFailed(
        userId: string,
        reason?: string,
    ): Promise<void> {
        await this.create(
            userId,
            NotificationType.PAYMENT_FAILED,
            'Payment Failed',
            reason || 'Your payment could not be processed. Please update your payment method.',
            { reason },
            true,
            `/subscription/payment`,
        );
    }

    async notifySubscriptionExpiring(
        userId: string,
        daysRemaining: number,
    ): Promise<void> {
        await this.create(
            userId,
            NotificationType.SUBSCRIPTION_EXPIRING,
            'Subscription Expiring Soon',
            `Your subscription expires in ${daysRemaining} days. Renew to continue your training.`,
            { daysRemaining },
            true,
            `/subscription`,
        );
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SYSTEM NOTIFICATIONS
    // ══════════════════════════════════════════════════════════════════════════════

    async notifyWelcome(userId: string, userName: string): Promise<void> {
        await this.create(
            userId,
            NotificationType.WELCOME,
            'Welcome to FitGlow!',
            `Hi ${userName}! Start your fitness journey by completing your profile.`,
            {},
            true,
            `/profile/setup`,
        );
    }

    async notifyCoachVerified(coachId: string): Promise<void> {
        await this.create(
            coachId,
            NotificationType.COACH_VERIFIED,
            'Profile Verified',
            'Your coach profile has been verified. You can now accept clients!',
            {},
            true,
            `/coach/dashboard`,
        );
    }

    async notifySystem(
        userId: string,
        title: string,
        message: string,
        data?: Record<string, any>,
    ): Promise<void> {
        await this.create(
            userId,
            NotificationType.SYSTEM,
            title,
            message,
            data,
            false,
        );
    }
}
