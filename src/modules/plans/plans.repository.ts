import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseAbstractRepository } from '../../common/repositories/base.abstract.repository';
import { Plan, PlanDocument } from './schemas/plan.schema';

@Injectable()
export class PlansRepository extends BaseAbstractRepository<PlanDocument> {
    constructor(@InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>) {
        super(planModel);
    }

    async findActivePlan(userId: string): Promise<PlanDocument | null> {
        return this.planModel.findOne({ userId, status: 'active' }).exec();
    }

    async archivePlan(planId: string): Promise<void> {
        await this.planModel.findByIdAndUpdate(planId, { status: 'archived' }).exec();
    }

    async findByCoachAndCustomer(coachId: string, customerId: string): Promise<PlanDocument | null> {
        return this.planModel.findOne({ coachId, customerId }).exec();
    }
}
