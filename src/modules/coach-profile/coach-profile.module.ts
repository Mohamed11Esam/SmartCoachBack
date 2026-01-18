import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoachProfile, CoachProfileSchema } from './schemas/coach-profile.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import { CoachProfileRepository } from './coach-profile.repository';
import { ReviewRepository } from './review.repository';
import { CoachProfileService } from './coach-profile.service';
import { CoachProfileController } from './coach-profile.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CoachProfile.name, schema: CoachProfileSchema },
            { name: Review.name, schema: ReviewSchema },
        ]),
    ],
    providers: [CoachProfileRepository, ReviewRepository, CoachProfileService],
    controllers: [CoachProfileController],
    exports: [CoachProfileService],
})
export class CoachProfileModule { }
