import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { BaseAbstractRepository } from '../../common/repositories/base.abstract.repository';
import { Goal, GoalDocument } from './schemas/goal.schema';

@Injectable()
export class GoalRepository extends BaseAbstractRepository<GoalDocument> {
    constructor(@InjectModel(Goal.name) private goalModel: Model<GoalDocument>) {
        super(goalModel);
    }

    async findByUserId(userId: string): Promise<GoalDocument[]> {
        return this.goalModel.find({ userId }).sort({ createdAt: -1 }).exec();
    }

    async findActiveByUserId(userId: string): Promise<GoalDocument[]> {
        return this.goalModel.find({ userId, status: 'InProgress' }).sort({ createdAt: -1 }).exec();
    }
}
