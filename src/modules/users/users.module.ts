import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminController } from './admin.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    controllers: [UsersController, AdminController],
    providers: [UsersRepository, UsersService],
    exports: [UsersService],
})
export class UsersModule { }
