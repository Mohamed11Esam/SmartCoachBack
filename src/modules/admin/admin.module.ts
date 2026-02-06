import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CoachProfile, CoachProfileSchema } from '../coach-profile/schemas/coach-profile.schema';
import { Order, OrderSchema } from '../cart/schemas/order.schema';
import { Session, SessionSchema } from '../schedule/schemas/session.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { FreeWorkout, FreeWorkoutSchema } from '../workouts/schemas/workout.schema';
import { FreeNutrition, FreeNutritionSchema } from '../nutrition/schemas/nutrition.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: CoachProfile.name, schema: CoachProfileSchema },
            { name: Order.name, schema: OrderSchema },
            { name: Session.name, schema: SessionSchema },
            { name: Product.name, schema: ProductSchema },
            { name: FreeWorkout.name, schema: FreeWorkoutSchema },
            { name: FreeNutrition.name, schema: FreeNutritionSchema },
        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
