import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Plan, PlanSchema } from './schemas/plan.schema';
import { PlansRepository } from './plans.repository';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { PlanFactory } from './factories/plan.factory';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Plan.name, schema: PlanSchema }]),
    ],
    providers: [PlansRepository, PlansService, PlanFactory],
    controllers: [PlansController],
    exports: [PlansService],
})
export class PlansModule { }
