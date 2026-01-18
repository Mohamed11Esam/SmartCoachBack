import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseAbstractRepository } from '../../common/repositories/base.abstract.repository';
import { ProgressLog } from './schemas/progress-log.schema';

@Injectable()
export class ProgressLogsRepository extends BaseAbstractRepository<ProgressLog> {
    constructor(@InjectModel(ProgressLog.name) private progressLogModel: Model<ProgressLog>) {
        super(progressLogModel);
    }

    async findByUserId(userId: string): Promise<ProgressLog[]> {
        return this.progressLogModel.find({ userId }).sort({ date: -1 }).exec();
    }

    async findByPlanId(planId: string): Promise<ProgressLog[]> {
        return this.progressLogModel.find({ planId }).sort({ date: -1 }).exec();
    }
}
