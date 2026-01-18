import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FreeNutrition, FreeNutritionDocument } from './schemas/nutrition.schema';

@Injectable()
export class NutritionService {
    constructor(
        @InjectModel(FreeNutrition.name) private nutritionModel: Model<FreeNutritionDocument>,
    ) { }

    async findAll(query: any = {}): Promise<FreeNutrition[]> {
        const filter: any = {};
        if (query.tags) filter.tags = { $in: query.tags.split(',') };

        // Calorie range
        if (query.minCalories) filter.calories = { $gte: Number(query.minCalories) };
        if (query.maxCalories) filter.calories = { ...filter.calories, $lte: Number(query.maxCalories) };

        // Macro ranges
        if (query.minProtein) filter.protein = { $gte: Number(query.minProtein) };
        if (query.maxProtein) filter.protein = { ...filter.protein, $lte: Number(query.maxProtein) };

        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: 'i' } },
                { content: { $regex: query.search, $options: 'i' } },
            ];
        }
        return this.nutritionModel.find(filter).exec();
    }

    async findOne(id: string): Promise<FreeNutrition | null> {
        return this.nutritionModel.findById(id).exec();
    }

    async findByTitle(title: string): Promise<FreeNutrition | null> {
        return this.nutritionModel.findOne({ title }).exec();
    }

    async create(createNutritionDto: any): Promise<FreeNutrition> {
        const createdNutrition = new this.nutritionModel(createNutritionDto);
        return createdNutrition.save();
    }

    async update(id: string, updateDto: any): Promise<FreeNutrition | null> {
        return this.nutritionModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    }

    async delete(id: string): Promise<FreeNutrition | null> {
        return this.nutritionModel.findByIdAndDelete(id).exec();
    }
}
