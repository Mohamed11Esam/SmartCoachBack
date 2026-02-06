import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CoachProfile, CoachProfileDocument } from '../coach-profile/schemas/coach-profile.schema';
import { Order, OrderDocument } from '../cart/schemas/order.schema';
import { Session, SessionDocument } from '../schedule/schemas/session.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { FreeWorkout, FreeWorkoutDocument } from '../workouts/schemas/workout.schema';
import { FreeNutrition, FreeNutritionDocument } from '../nutrition/schemas/nutrition.schema';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(CoachProfile.name) private coachProfileModel: Model<CoachProfileDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(FreeWorkout.name) private workoutModel: Model<FreeWorkoutDocument>,
        @InjectModel(FreeNutrition.name) private nutritionModel: Model<FreeNutritionDocument>,
    ) {}

    async getDashboardStats() {
        const [
            userStats,
            coachStats,
            revenueStats,
            sessionStats,
            contentStats,
        ] = await Promise.all([
            this.getUserStats(),
            this.getCoachStats(),
            this.getRevenueStats(),
            this.getSessionStats(),
            this.getContentStats(),
        ]);

        return {
            users: userStats,
            coaches: coachStats,
            revenue: revenueStats,
            sessions: sessionStats,
            content: contentStats,
        };
    }

    async getUserStats() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            totalUsers,
            totalCustomers,
            totalCoaches,
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
            newUsersLastMonth,
            activeUsersThisWeek,
        ] = await Promise.all([
            this.userModel.countDocuments(),
            this.userModel.countDocuments({ role: 'Customer' }),
            this.userModel.countDocuments({ role: 'Coach' }),
            this.userModel.countDocuments({ createdAt: { $gte: startOfToday } }),
            this.userModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
            this.userModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
            this.userModel.countDocuments({
                createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
            }),
            this.userModel.countDocuments({
                lastLoginAt: { $gte: startOfWeek }
            }),
        ]);

        // Calculate growth percentage
        const growthPercentage = newUsersLastMonth > 0
            ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
            : 100;

        return {
            total: totalUsers,
            customers: totalCustomers,
            coaches: totalCoaches,
            newToday: newUsersToday,
            newThisWeek: newUsersThisWeek,
            newThisMonth: newUsersThisMonth,
            activeThisWeek: activeUsersThisWeek,
            growthPercentage,
        };
    }

    async getCoachStats() {
        const [
            totalCoaches,
            verifiedCoaches,
            pendingVerification,
            activeCoaches,
        ] = await Promise.all([
            this.coachProfileModel.countDocuments(),
            this.coachProfileModel.countDocuments({ isVerified: true }),
            this.coachProfileModel.countDocuments({ isVerified: false }),
            this.coachProfileModel.countDocuments({
                isVerified: true,
                isActive: true,
            }),
        ]);

        // Get top coaches by rating
        const topCoaches = await this.coachProfileModel
            .find({ isVerified: true })
            .populate('userId', 'firstName lastName photoUrl')
            .sort({ averageRating: -1, totalReviews: -1 })
            .limit(5)
            .select('userId averageRating totalReviews specializations')
            .exec();

        return {
            total: totalCoaches,
            verified: verifiedCoaches,
            pendingVerification,
            active: activeCoaches,
            topCoaches,
        };
    }

    async getRevenueStats() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Aggregate revenue
        const revenueAggregation = await this.orderModel.aggregate([
            {
                $match: {
                    status: { $nin: ['cancelled', 'pending'] },
                },
            },
            {
                $facet: {
                    total: [
                        { $group: { _id: null, sum: { $sum: '$totalAmount' } } }
                    ],
                    today: [
                        { $match: { createdAt: { $gte: startOfToday } } },
                        { $group: { _id: null, sum: { $sum: '$totalAmount' } } }
                    ],
                    thisWeek: [
                        { $match: { createdAt: { $gte: startOfWeek } } },
                        { $group: { _id: null, sum: { $sum: '$totalAmount' } } }
                    ],
                    thisMonth: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        { $group: { _id: null, sum: { $sum: '$totalAmount' } } }
                    ],
                    lastMonth: [
                        { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } } },
                        { $group: { _id: null, sum: { $sum: '$totalAmount' } } }
                    ],
                },
            },
        ]);

        const result = revenueAggregation[0];
        const totalRevenue = result.total[0]?.sum || 0;
        const revenueToday = result.today[0]?.sum || 0;
        const revenueThisWeek = result.thisWeek[0]?.sum || 0;
        const revenueThisMonth = result.thisMonth[0]?.sum || 0;
        const revenueLastMonth = result.lastMonth[0]?.sum || 0;

        // Calculate growth percentage
        const growthPercentage = revenueLastMonth > 0
            ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
            : 100;

        // Get order counts
        const [totalOrders, ordersThisMonth] = await Promise.all([
            this.orderModel.countDocuments({ status: { $nin: ['cancelled'] } }),
            this.orderModel.countDocuments({
                status: { $nin: ['cancelled'] },
                createdAt: { $gte: startOfMonth }
            }),
        ]);

        return {
            total: totalRevenue,
            today: revenueToday,
            thisWeek: revenueThisWeek,
            thisMonth: revenueThisMonth,
            growthPercentage,
            totalOrders,
            ordersThisMonth,
        };
    }

    async getSessionStats() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalSessions,
            completedSessions,
            upcomingSessions,
            sessionsThisWeek,
            sessionsThisMonth,
            canceledThisMonth,
        ] = await Promise.all([
            this.sessionModel.countDocuments(),
            this.sessionModel.countDocuments({ status: 'completed' }),
            this.sessionModel.countDocuments({
                scheduledDate: { $gte: now },
                status: { $in: ['scheduled', 'confirmed'] }
            }),
            this.sessionModel.countDocuments({
                scheduledDate: { $gte: startOfWeek }
            }),
            this.sessionModel.countDocuments({
                scheduledDate: { $gte: startOfMonth }
            }),
            this.sessionModel.countDocuments({
                status: 'canceled',
                canceledAt: { $gte: startOfMonth }
            }),
        ]);

        // Completion rate
        const completionRate = totalSessions > 0
            ? Math.round((completedSessions / totalSessions) * 100)
            : 0;

        return {
            total: totalSessions,
            completed: completedSessions,
            upcoming: upcomingSessions,
            thisWeek: sessionsThisWeek,
            thisMonth: sessionsThisMonth,
            canceledThisMonth,
            completionRate,
        };
    }

    async getContentStats() {
        const [
            totalWorkouts,
            totalMeals,
            totalProducts,
            activeProducts,
        ] = await Promise.all([
            this.workoutModel.countDocuments(),
            this.nutritionModel.countDocuments(),
            this.productModel.countDocuments(),
            this.productModel.countDocuments({ isActive: true }),
        ]);

        return {
            workouts: totalWorkouts,
            meals: totalMeals,
            products: {
                total: totalProducts,
                active: activeProducts,
            },
        };
    }

    // Chart data for dashboard
    async getRevenueChartData(period: 'week' | 'month' = 'week') {
        const now = new Date();
        let startDate: Date;
        let groupFormat: string;
        let labels: string[];

        if (period === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            groupFormat = '%Y-%m-%d';
            labels = this.getLast7Days();
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
            groupFormat = '%Y-%m';
            labels = this.getLast12Months();
        }

        const revenueData = await this.orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $nin: ['cancelled', 'pending'] },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Map to labels
        const revenueMap = new Map(revenueData.map(d => [d._id, d.revenue]));
        const data = labels.map(label => revenueMap.get(label) || 0);

        return {
            labels,
            data,
            period,
        };
    }

    async getNewUsersChartData(period: 'week' | 'month' = 'week') {
        const now = new Date();
        let startDate: Date;
        let groupFormat: string;
        let labels: string[];

        if (period === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            groupFormat = '%Y-%m-%d';
            labels = this.getLast7Days();
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
            groupFormat = '%Y-%m';
            labels = this.getLast12Months();
        }

        const userData = await this.userModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Map to labels
        const userMap = new Map(userData.map(d => [d._id, d.count]));
        const data = labels.map(label => userMap.get(label) || 0);

        return {
            labels,
            data,
            period,
        };
    }

    private getLast7Days(): string[] {
        const days: string[] = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    }

    private getLast12Months(): string[] {
        const months: string[] = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(d.toISOString().slice(0, 7)); // YYYY-MM format
        }
        return months;
    }

    // Recent activity for dashboard
    async getRecentActivity(limit = 10) {
        const [recentOrders, recentUsers, recentSessions] = await Promise.all([
            this.orderModel
                .find()
                .populate('userId', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .limit(limit)
                .select('userId totalAmount status createdAt')
                .exec(),
            this.userModel
                .find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .select('firstName lastName email role createdAt')
                .exec(),
            this.sessionModel
                .find({ status: { $in: ['completed', 'canceled'] } })
                .populate('coachId', 'firstName lastName')
                .populate('clientId', 'firstName lastName')
                .sort({ updatedAt: -1 })
                .limit(limit)
                .select('coachId clientId status scheduledDate updatedAt')
                .exec(),
        ]);

        // Combine and sort by date
        const activities = [
            ...recentOrders.map(o => ({
                type: 'order',
                data: o,
                timestamp: (o as any).createdAt,
            })),
            ...recentUsers.map(u => ({
                type: 'new_user',
                data: u,
                timestamp: (u as any).createdAt,
            })),
            ...recentSessions.map(s => ({
                type: 'session',
                data: s,
                timestamp: (s as any).updatedAt,
            })),
        ];

        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return activities.slice(0, limit);
    }
}
