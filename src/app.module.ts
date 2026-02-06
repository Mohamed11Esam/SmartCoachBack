import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoachProfileModule } from './modules/coach-profile/coach-profile.module';
import { PlansModule } from './modules/plans/plans.module';
import { ChatModule } from './modules/chat/chat.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProgressLogsModule } from './modules/progress-logs/progress-logs.module';
import { MediaModule } from './modules/media/media.module';
import { AiModule } from './modules/ai/ai.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { EmailModule } from './modules/email/email.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { CoachClientModule } from './modules/coach-client/coach-client.module';
import { PromoCodeModule } from './modules/promo-code/promo-code.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting: 100 requests per 60 seconds globally
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    // Cron jobs scheduler
    NestScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CoachProfileModule,
    PlansModule,
    ChatModule,
    PaymentsModule,
    ProgressLogsModule,
    MediaModule,
    AiModule,
    WorkoutsModule,
    NutritionModule,
    EmailModule,
    NotificationsModule,
    ProductsModule,
    CartModule,
    CoachClientModule,
    PromoCodeModule,
    ScheduleModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply throttling globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }

