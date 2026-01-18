import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressLog, ProgressLogSchema } from './schemas/progress-log.schema';
import { Goal, GoalSchema } from './schemas/goal.schema';
import { MetricLog, MetricLogSchema } from './schemas/metric-log.schema';
import { ProgressLogsRepository } from './progress-logs.repository';
import { GoalRepository } from './goal.repository';
import { MetricLogRepository } from './metric-log.repository';
import { ProgressLogsService } from './progress-logs.service';
import { ProgressLogsController } from './progress-logs.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ProgressLog.name, schema: ProgressLogSchema },
            { name: Goal.name, schema: GoalSchema },
            { name: MetricLog.name, schema: MetricLogSchema },
        ]),
    ],
    controllers: [ProgressLogsController],
    providers: [ProgressLogsService, ProgressLogsRepository, GoalRepository, MetricLogRepository],
    exports: [ProgressLogsService],
})
export class ProgressLogsModule { }
