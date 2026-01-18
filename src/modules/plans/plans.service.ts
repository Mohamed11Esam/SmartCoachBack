import { Injectable, NotFoundException } from '@nestjs/common';
import { PlansRepository } from './plans.repository';
import { PlanFactory } from './factories/plan.factory';
import { PlanDocument } from './schemas/plan.schema';

@Injectable()
export class PlansService {
    constructor(
        private readonly plansRepository: PlansRepository,
        private readonly planFactory: PlanFactory,
    ) { }

    async create(dto: any): Promise<PlanDocument> {
        const plan = this.planFactory.create(dto);
        return this.plansRepository.create(plan);
    }

    async updatePlan(planId: string, newDays: any[]): Promise<PlanDocument> {
        const oldPlan = await this.plansRepository.findOneById(planId);
        if (!oldPlan) {
            throw new NotFoundException('Plan not found');
        }

        // Archive old plan
        await this.plansRepository.archivePlan(planId);

        // Create new version
        const newPlan = this.planFactory.createUpdatedVersion(oldPlan, newDays);
        return this.plansRepository.create(newPlan);
    }

    async getActivePlan(userId: string): Promise<PlanDocument | null> {
        return this.plansRepository.findActivePlan(userId);
    }

    async findByCoachAndCustomer(coachId: string, customerId: string): Promise<PlanDocument | null> {
        return this.plansRepository.findByCoachAndCustomer(coachId, customerId);
    }
}
