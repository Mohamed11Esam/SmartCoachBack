import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { FirebaseService } from './firebase.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
        ConfigModule,
        forwardRef(() => UsersModule),
    ],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        NotificationsRepository,
        NotificationsGateway,
        FirebaseService,
    ],
    exports: [NotificationsService, FirebaseService],
})
export class NotificationsModule { }
