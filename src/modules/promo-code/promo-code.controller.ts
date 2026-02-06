import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PromoCodeService } from './promo-code.service';
import { CreatePromoCodeDto, ValidatePromoCodeDto } from './dto/promo-code.dto';

@ApiTags('Promo Codes')
@Controller('promo-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PromoCodeController {
    constructor(private readonly promoCodeService: PromoCodeService) {}

    // ── Public (authenticated users) ──

    @Post('validate')
    @ApiOperation({ summary: 'Validate a promo code and get discount amount' })
    async validate(@Request() req, @Body() dto: ValidatePromoCodeDto) {
        const result = await this.promoCodeService.validate(req.user.userId, dto);
        return {
            valid: result.valid,
            discountAmount: result.discountAmount,
            message: result.message,
            discountType: result.promoCode?.discountType,
            discountValue: result.promoCode?.discountValue,
        };
    }

    // ── Admin only ──

    @Post()
    @Roles('Admin')
    @ApiOperation({ summary: 'Create a new promo code (Admin)' })
    async create(@Body() dto: CreatePromoCodeDto) {
        return this.promoCodeService.create(dto);
    }

    @Get()
    @Roles('Admin')
    @ApiOperation({ summary: 'Get all promo codes (Admin)' })
    async findAll() {
        return this.promoCodeService.findAll();
    }

    @Put(':id')
    @Roles('Admin')
    @ApiOperation({ summary: 'Update a promo code (Admin)' })
    async update(@Param('id') id: string, @Body() dto: Partial<CreatePromoCodeDto>) {
        return this.promoCodeService.update(id, dto);
    }

    @Delete(':id')
    @Roles('Admin')
    @ApiOperation({ summary: 'Delete a promo code (Admin)' })
    async delete(@Param('id') id: string) {
        await this.promoCodeService.delete(id);
        return { message: 'Promo code deleted' };
    }
}
