import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ChatModule } from '../chat/chat.module';
import { AiSession, AiSessionSchema } from './schemas/ai-session.schema';

@Module({
    imports: [
        HttpModule,
        ChatModule,
        MongooseModule.forFeature([
            { name: AiSession.name, schema: AiSessionSchema },
        ]),
    ],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
