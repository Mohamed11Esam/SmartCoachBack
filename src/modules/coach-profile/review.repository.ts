import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseAbstractRepository } from '../../common/repositories/base.abstract.repository';
import { Review, ReviewDocument } from './schemas/review.schema';

@Injectable()
export class ReviewRepository extends BaseAbstractRepository<ReviewDocument> {
    constructor(@InjectModel(Review.name) private reviewModel: Model<ReviewDocument>) {
        super(reviewModel);
    }

    async findByCoachId(coachId: string): Promise<ReviewDocument[]> {
        return this.reviewModel.find({ coachId }).sort({ createdAt: -1 }).exec();
    }

    async findByUserId(userId: string): Promise<ReviewDocument[]> {
        return this.reviewModel.find({ userId }).sort({ createdAt: -1 }).exec();
    }

    async findByCoachAndUser(coachId: string, userId: string): Promise<ReviewDocument | null> {
        return this.reviewModel.findOne({ coachId, userId }).exec();
    }

    async getAverageRating(coachId: string): Promise<number> {
        const result = await this.reviewModel.aggregate([
            { $match: { coachId } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]).exec();
        return result.length > 0 ? result[0].avgRating : 0;
    }
}
