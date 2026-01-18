import { Injectable } from '@nestjs/common';
import { BaseFactoryInterface } from '../../../common/interfaces/base.factory.interface';
import { Plan } from '../schemas/plan.schema';
import { Types } from 'mongoose';

@Injectable()
export class PlanFactory implements BaseFactoryInterface<Plan> {
    create(dto: any): Plan {
        const plan = new Plan();
        plan.userId = new Types.ObjectId(dto.userId);
        plan.coachId = new Types.ObjectId(dto.coachId);
        plan.status = 'active';
        plan.versionNumber = 1;
        plan.days = dto.days;
        plan.goal = dto.goal;
        return plan;
    }

    createUpdatedVersion(oldPlan: Plan, newDays: any[]): Plan {
        const plan = new Plan();
        plan.userId = oldPlan.userId;
        plan.coachId = oldPlan.coachId;
        plan.status = 'active';
        plan.versionNumber = oldPlan.versionNumber + 1;
        plan.days = newDays;
        plan.goal = oldPlan.goal;
        return plan;
    }
}
