import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Order, OrderDocument } from '../cart/schemas/order.schema';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    ) {}

    async getDashboardStats() {
        const now = new Date();

        // Current period: last 30 days
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Previous period: 30-60 days ago
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Revenue - current period
        const currentRevenue = await this.orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $ne: 'cancelled' },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        // Revenue - previous period
        const previousRevenue = await this.orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
                    status: { $ne: 'cancelled' },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        const totalRevenue = currentRevenue[0]?.total || 0;
        const prevRevenue = previousRevenue[0]?.total || 0;
        const revenueChange = prevRevenue > 0
            ? Number((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
            : totalRevenue > 0 ? 100 : 0;

        // Subscriptions
        const totalSubscriptions = await this.userModel.countDocuments({
            subscriptionStatus: 'active',
        });
        const prevSubscriptions = await this.userModel.countDocuments({
            subscriptionStatus: 'active',
            updatedAt: { $lt: thirtyDaysAgo },
        });
        const subscriptionsChange = prevSubscriptions > 0
            ? Number((((totalSubscriptions - prevSubscriptions) / prevSubscriptions) * 100).toFixed(1))
            : totalSubscriptions > 0 ? 100 : 0;

        // Active users (updated in last 30 days)
        const activeUsers = await this.userModel.countDocuments({
            updatedAt: { $gte: thirtyDaysAgo },
        });
        const prevActiveUsers = await this.userModel.countDocuments({
            updatedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        });
        const activeUsersChange = prevActiveUsers > 0
            ? Number((((activeUsers - prevActiveUsers) / prevActiveUsers) * 100).toFixed(1))
            : activeUsers > 0 ? 100 : 0;

        // New users
        const newUsers = await this.userModel.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
        });
        const prevNewUsers = await this.userModel.countDocuments({
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        });
        const newUsersChange = prevNewUsers > 0
            ? Number((((newUsers - prevNewUsers) / prevNewUsers) * 100).toFixed(1))
            : newUsers > 0 ? 100 : 0;

        return {
            totalRevenue,
            revenueChange,
            totalSubscriptions,
            subscriptionsChange,
            activeUsers,
            activeUsersChange,
            newUsers,
            newUsersChange,
        };
    }

    async getRevenueChart(period: '7d' | '30d') {
        const now = new Date();
        const days = period === '7d' ? 7 : 30;
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);

        if (period === '7d') {
            // Group by day of week
            const result = await this.orderModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        status: { $ne: 'cancelled' },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                        },
                        value: { $sum: '$totalAmount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Fill in missing days
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const data: { name: string; value: number }[] = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const found = result.find((r) => r._id === key);
                data.push({
                    name: dayNames[d.getDay()],
                    value: found ? found.value : 0,
                });
            }
            return data;
        } else {
            // Group by week
            const result = await this.orderModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        status: { $ne: 'cancelled' },
                    },
                },
                {
                    $group: {
                        _id: { $isoWeek: '$createdAt' },
                        value: { $sum: '$totalAmount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            return result.map((r, i) => ({
                name: `Week ${i + 1}`,
                value: r.value,
            }));
        }
    }

    async getNewUsersChart(period: '7d' | '30d') {
        const now = new Date();
        const days = period === '7d' ? 7 : 30;
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);

        if (period === '7d') {
            const result = await this.userModel.aggregate([
                {
                    $match: { createdAt: { $gte: startDate } },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                        },
                        value: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const data: { name: string; value: number }[] = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const found = result.find((r) => r._id === key);
                data.push({
                    name: dayNames[d.getDay()],
                    value: found ? found.value : 0,
                });
            }
            return data;
        } else {
            const result = await this.userModel.aggregate([
                {
                    $match: { createdAt: { $gte: startDate } },
                },
                {
                    $group: {
                        _id: { $isoWeek: '$createdAt' },
                        value: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            return result.map((r, i) => ({
                name: `Week ${i + 1}`,
                value: r.value,
            }));
        }
    }
}
