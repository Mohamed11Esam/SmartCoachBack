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
    ) { }

    async create(
        userId: string,
        type: NotificationType,
        title: string,
        body: string,
        data?: Record<string, any>,
        sendEmail: boolean = false,
    ): Promise<NotificationDocument> {
        // Save to database
        const notification = await this.notificationsRepository.create({
            userId,
            type,
            title,
            body,
            data,
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

    // Convenience methods for triggering notifications
    async notifyNewMessage(userId: string, senderName: string, chatId: string): Promise<void> {
        await this.create(
            userId,
            NotificationType.MESSAGE,
            'New Message',
            `You have a new message from ${senderName}`,
            { chatId },
        );
    }

    async notifyPlanUpdate(userId: string, planTitle: string, planId: string): Promise<void> {
        await this.create(
            userId,
            NotificationType.PLAN_UPDATE,
            'Plan Updated',
            `Your plan "${planTitle}" has been updated`,
            { planId },
            true, // Send email for plan updates
        );
    }

    async notifyGoalCompleted(userId: string, goalType: string, goalId: string): Promise<void> {
        await this.create(
            userId,
            NotificationType.GOAL,
            '🎉 Goal Achieved!',
            `Congratulations! You've completed your ${goalType} goal!`,
            { goalId },
            true, // Send email for achievements
        );
    }
}
