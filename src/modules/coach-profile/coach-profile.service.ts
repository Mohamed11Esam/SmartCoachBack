import { Injectable, ConflictException } from '@nestjs/common';
import { CoachProfileRepository } from './coach-profile.repository';
import { ReviewRepository } from './review.repository';
import { CreateCoachProfileDto } from './dto/create-coach-profile.dto';
import { CoachProfileDocument } from './schemas/coach-profile.schema';
import { ReviewDocument } from './schemas/review.schema';

@Injectable()
export class CoachProfileService {
    constructor(
        private readonly coachProfileRepository: CoachProfileRepository,
        private readonly reviewRepository: ReviewRepository,
    ) { }

    async create(userId: string, dto: CreateCoachProfileDto): Promise<CoachProfileDocument> {
        return this.coachProfileRepository.create({ ...dto, userId });
    }

    async findByUserId(userId: string): Promise<CoachProfileDocument | null> {
        return this.coachProfileRepository.findByUserId(userId);
    }

    async update(id: string, dto: Partial<CreateCoachProfileDto>): Promise<CoachProfileDocument> {
        return this.coachProfileRepository.update(id, dto);
    }

    async findAll(query: any): Promise<CoachProfileDocument[]> {
        const filter: any = {};

        // Filter by specialties
        if (query.specialties) {
            filter.specialties = { $in: query.specialties.split(',') };
        }

        // Filter by verified status
        if (query.isVerified !== undefined) {
            filter.isVerified = query.isVerified === 'true';
        }

        // Filter by minimum rating
        if (query.minRating) {
            filter.averageRating = { $gte: query.minRating };
        }

        return this.coachProfileRepository.findAll(filter, query.search);
    }

    async findOne(id: string): Promise<CoachProfileDocument> {
        return this.coachProfileRepository.findOneById(id);
    }

    async addReview(coachId: string, userId: string, rating: number, comment: string): Promise<ReviewDocument> {
        // Check if user already reviewed this coach
        const existingReview = await this.reviewRepository.findByCoachAndUser(coachId, userId);
        if (existingReview) {
            throw new ConflictException('You have already reviewed this coach');
        }

        const review = await this.reviewRepository.create({
            coachId,
            userId,
            rating,
            comment,
        });

        // Update coach's average rating
        const avgRating = await this.reviewRepository.getAverageRating(coachId);
        await this.coachProfileRepository.update(coachId, { averageRating: avgRating });

        return review;
    }

    async getReviews(coachId: string): Promise<ReviewDocument[]> {
        return this.reviewRepository.findByCoachId(coachId);
    }
}
