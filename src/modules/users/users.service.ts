import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) { }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.usersRepository.findByEmail(email);
    }

    async create(userData: CreateUserDto): Promise<UserDocument> {
        return this.usersRepository.create(userData);
    }

    async findById(id: string): Promise<UserDocument> {
        return this.usersRepository.findOneById(id);
    }

    async update(id: string, updateDto: any): Promise<UserDocument> {
        return this.usersRepository.update(id, updateDto);
    }

    async findByStripeCustomerId(customerId: string): Promise<UserDocument | null> {
        return this.usersRepository.findByStripeCustomerId(customerId);
    }

    async updateSubscription(
        userId: string,
        status: string,
        subscriptionId?: string,
        subscribedCoachId?: string
    ): Promise<UserDocument> {
        return this.usersRepository.update(userId, {
            subscriptionStatus: status,
            subscriptionId,
            subscribedCoachId,
        } as any);
    }

    async findAll(): Promise<UserDocument[]> {
        return this.usersRepository.findAll();
    }

    async getDashboardStats() {
        const totalUsers = (await this.usersRepository.findAll()).length;
        const totalCoaches = await this.usersRepository.countByRole('Coach');

        // Active users in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsersLast30Days = await this.usersRepository.countActiveUsersSince(thirtyDaysAgo);

        // New users this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newUsersThisMonth = await this.usersRepository.countNewUsersSince(startOfMonth);

        return {
            totalUsers,
            totalCoaches,
            activeUsersLast30Days,
            totalRevenue: 0, // Would need payment integration for real data
            newUsersThisMonth
        };
    }

    // Saved items methods
    async saveWorkout(userId: string, workoutId: string) {
        return this.usersRepository.addSavedWorkout(userId, workoutId);
    }

    async unsaveWorkout(userId: string, workoutId: string) {
        return this.usersRepository.removeSavedWorkout(userId, workoutId);
    }

    async saveMeal(userId: string, mealId: string) {
        return this.usersRepository.addSavedMeal(userId, mealId);
    }

    async unsaveMeal(userId: string, mealId: string) {
        return this.usersRepository.removeSavedMeal(userId, mealId);
    }

    async getSavedItems(userId: string) {
        const user = await this.usersRepository.getSavedItems(userId);
        return {
            savedWorkouts: user?.savedWorkouts || [],
            savedMeals: user?.savedMeals || [],
        };
    }
}
