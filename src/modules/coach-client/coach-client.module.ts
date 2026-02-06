import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoachClientController } from './coach-client.controller';
import { CoachClientService } from './coach-client.service';
import { ClientRequest, ClientRequestSchema } from './schemas/client-request.schema';
import { CoachClient, CoachClientSchema } from './schemas/coach-client.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ClientRequest.name, schema: ClientRequestSchema },
            { name: CoachClient.name, schema: CoachClientSchema },
        ]),
        forwardRef(() => NotificationsModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [CoachClientController],
    providers: [CoachClientService],
    exports: [CoachClientService],
})
export class CoachClientModule {}
