import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseAbstractRepository } from '../../common/repositories/base.abstract.repository';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsRepository extends BaseAbstractRepository<NotificationDocument> {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) {
        super(notificationModel);
    }

    async findByUserId(userId: string, unreadOnly: boolean = false): Promise<NotificationDocument[]> {
        const filter: any = { userId };
        if (unreadOnly) {
            filter.read = false;
        }
        return this.notificationModel.find(filter).sort({ createdAt: -1 }).limit(50).exec();
    }

    async countUnread(userId: string): Promise<number> {
        return this.notificationModel.countDocuments({ userId, read: false }).exec();
    }

    async markAsRead(notificationId: string): Promise<NotificationDocument | null> {
        return this.notificationModel.findByIdAndUpdate(notificationId, { read: true }, { new: true }).exec();
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationModel.updateMany({ userId, read: false }, { read: true }).exec();
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.notificationModel.deleteMany({ userId }).exec();
    }
}
