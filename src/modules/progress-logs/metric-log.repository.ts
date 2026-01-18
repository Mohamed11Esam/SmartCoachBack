import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseAbstractRepository } from '../../common/repositories/base.abstract.repository';
import { MetricLog, MetricLogDocument } from './schemas/metric-log.schema';

@Injectable()
export class MetricLogRepository extends BaseAbstractRepository<MetricLogDocument> {
    constructor(@InjectModel(MetricLog.name) private metricLogModel: Model<MetricLogDocument>) {
        super(metricLogModel);
    }

    async findByUserId(userId: string): Promise<MetricLogDocument[]> {
        return this.metricLogModel.find({ userId }).sort({ date: -1 }).exec();
    }

    async findLatestByUserId(userId: string): Promise<MetricLogDocument | null> {
        return this.metricLogModel.findOne({ userId }).sort({ date: -1 }).exec();
    }
}
