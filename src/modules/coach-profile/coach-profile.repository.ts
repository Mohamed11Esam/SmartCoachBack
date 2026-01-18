import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseAbstractRepository } from '../../common/repositories/base.abstract.repository';
import { CoachProfile, CoachProfileDocument } from './schemas/coach-profile.schema';

@Injectable()
export class CoachProfileRepository extends BaseAbstractRepository<CoachProfileDocument> {
    constructor(
        @InjectModel(CoachProfile.name)
        private readonly coachProfileModel: Model<CoachProfileDocument>,
    ) {
        super(coachProfileModel);
    }

    async findByUserId(userId: string): Promise<CoachProfileDocument | null> {
        return this.coachProfileModel.findOne({ userId }).exec();
    }

    async findAll(filter: any = {}, search?: string): Promise<CoachProfileDocument[]> {
        if (!search) {
            return this.coachProfileModel.find(filter).populate('userId', 'firstName lastName').exec();
        }

        const pipeline: any[] = [
            { $match: filter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $match: {
                    $or: [
                        { 'user.firstName': { $regex: search, $options: 'i' } },
                        { 'user.lastName': { $regex: search, $options: 'i' } }
                    ]
                }
            },
            // Re-shape to match the find().populate() structure if needed, or just return as is
            // Assuming frontend handles 'user' object same as populated 'userId'
            {
                $addFields: {
                    userId: '$user' // Map 'user' back to 'userId' field to match standard output
                }
            },
            { $project: { user: 0 } } // Remove temporary user field
        ];

        return this.coachProfileModel.aggregate(pipeline).exec();
    }
}
