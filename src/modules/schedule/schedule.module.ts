import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { SessionReminderTask } from './session-reminder.task';
import { TimeSlot, TimeSlotSchema } from './schemas/time-slot.schema';
import { Session, SessionSchema } from './schemas/session.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TimeSlot.name, schema: TimeSlotSchema },
            { name: Session.name, schema: SessionSchema },
        ]),
        forwardRef(() => NotificationsModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [ScheduleController],
    providers: [ScheduleService, SessionReminderTask],
    exports: [ScheduleService],
})
export class ScheduleModule {}
