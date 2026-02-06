import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FreeWorkout, FreeWorkoutDocument } from './schemas/workout.schema';

@Injectable()
export class WorkoutsService {
    constructor(
        @InjectModel(FreeWorkout.name) private workoutModel: Model<FreeWorkoutDocument>,
    ) { }

    async findAll(query: any = {}): Promise<FreeWorkout[]> {
        const filter: any = {};

        // Category filter (Strength, Cardio, Yoga, etc.)
        if (query.category) filter.category = query.category;

        // Difficulty filter
        if (query.difficulty) filter.difficulty = query.difficulty;

        // Tags filter
        if (query.tags) filter.tags = { $in: query.tags.split(',') };

        // Duration range
        if (query.minDuration || query.maxDuration) {
            filter.duration = {};
            if (query.minDuration) filter.duration.$gte = Number(query.minDuration);
            if (query.maxDuration) filter.duration.$lte = Number(query.maxDuration);
        }

        // Calories range
        if (query.minCalories || query.maxCalories) {
            filter.calories = {};
            if (query.minCalories) filter.calories.$gte = Number(query.minCalories);
            if (query.maxCalories) filter.calories.$lte = Number(query.maxCalories);
        }

        // Text search
        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: 'i' } },
                { description: { $regex: query.search, $options: 'i' } },
                { tags: { $regex: query.search, $options: 'i' } },
            ];
        }

        return this.workoutModel.find(filter).sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<FreeWorkout | null> {
        return this.workoutModel.findById(id).exec();
    }

    async findByTitle(title: string): Promise<FreeWorkout | null> {
        return this.workoutModel.findOne({ title }).exec();
    }

    async create(createWorkoutDto: any): Promise<FreeWorkout> {
        const createdWorkout = new this.workoutModel(createWorkoutDto);
        return createdWorkout.save();
    }

    async update(id: string, updateDto: any): Promise<FreeWorkout | null> {
        return this.workoutModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    }

    async delete(id: string): Promise<FreeWorkout | null> {
        return this.workoutModel.findByIdAndDelete(id).exec();
    }
}
