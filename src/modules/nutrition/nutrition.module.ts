import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { FreeNutrition, FreeNutritionSchema } from './schemas/nutrition.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: FreeNutrition.name, schema: FreeNutritionSchema }]),
    ],
    controllers: [NutritionController],
    providers: [NutritionService],
    exports: [NutritionService],
})
export class NutritionModule { }
