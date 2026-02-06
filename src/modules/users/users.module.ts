import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Order, OrderSchema } from '../cart/schemas/order.schema';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { AnalyticsService } from './analytics.service';
import { UsersController } from './users.controller';
import { AdminController } from './admin.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Order.name, schema: OrderSchema },
        ]),
    ],
    controllers: [UsersController, AdminController],
    providers: [UsersRepository, UsersService, AnalyticsService],
    exports: [UsersService],
})
export class UsersModule {}
