import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { FreeWorkout, FreeWorkoutSchema } from './schemas/workout.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: FreeWorkout.name, schema: FreeWorkoutSchema }]),
    ],
    controllers: [WorkoutsController],
    providers: [WorkoutsService],
    exports: [WorkoutsService],
})
export class WorkoutsModule { }
