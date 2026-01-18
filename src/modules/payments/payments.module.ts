import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [ConfigModule, UsersModule],
    providers: [PaymentsService],
    controllers: [PaymentsController],
    exports: [PaymentsService],
})
export class PaymentsModule { }
