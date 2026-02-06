import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseAbstractRepository } from '../../common/repositories/base.abstract.repository';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersRepository extends BaseAbstractRepository<UserDocument> {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
        super(userModel);
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async countByRole(role: string): Promise<number> {
        return this.userModel.countDocuments({ role }).exec();
    }

    async countActiveUsersSince(date: Date): Promise<number> {
        return this.userModel.countDocuments({ updatedAt: { $gte: date } }).exec();
    }

    async countNewUsersSince(date: Date): Promise<number> {
        return this.userModel.countDocuments({ createdAt: { $gte: date } }).exec();
    }

    async findByStripeCustomerId(stripeCustomerId: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ stripeCustomerId }).exec();
    }

    async addSavedWorkout(userId: string, workoutId: string): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(
            userId,
            { $addToSet: { savedWorkouts: workoutId } },
            { new: true }
        ).exec();
    }

    async removeSavedWorkout(userId: string, workoutId: string): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(
            userId,
            { $pull: { savedWorkouts: workoutId } },
            { new: true }
        ).exec();
    }

    async addSavedMeal(userId: string, mealId: string): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(
            userId,
            { $addToSet: { savedMeals: mealId } },
            { new: true }
        ).exec();
    }

    async removeSavedMeal(userId: string, mealId: string): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(
            userId,
            { $pull: { savedMeals: mealId } },
            { new: true }
        ).exec();
    }

    async getSavedItems(userId: string): Promise<UserDocument | null> {
        return this.userModel
            .findById(userId)
            .populate('savedWorkouts')
            .populate('savedMeals')
            .exec();
    }
}
