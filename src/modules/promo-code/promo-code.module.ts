import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromoCodeController } from './promo-code.controller';
import { PromoCodeService } from './promo-code.service';
import { PromoCode, PromoCodeSchema } from './schemas/promo-code.schema';
import { PromoCodeUsage, PromoCodeUsageSchema } from './schemas/promo-code-usage.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PromoCode.name, schema: PromoCodeSchema },
            { name: PromoCodeUsage.name, schema: PromoCodeUsageSchema },
        ]),
    ],
    controllers: [PromoCodeController],
    providers: [PromoCodeService],
    exports: [PromoCodeService],
})
export class PromoCodeModule {}
