import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PromoCode, PromoCodeDocument } from './schemas/promo-code.schema';
import { PromoCodeUsage, PromoCodeUsageDocument } from './schemas/promo-code-usage.schema';
import { CreatePromoCodeDto, ValidatePromoCodeDto } from './dto/promo-code.dto';

@Injectable()
export class PromoCodeService {
    constructor(
        @InjectModel(PromoCode.name) private promoCodeModel: Model<PromoCodeDocument>,
        @InjectModel(PromoCodeUsage.name) private usageModel: Model<PromoCodeUsageDocument>,
    ) {}

    async create(dto: CreatePromoCodeDto): Promise<PromoCodeDocument> {
        const existing = await this.promoCodeModel.findOne({ code: dto.code.toUpperCase() });
        if (existing) {
            throw new BadRequestException('Promo code already exists');
        }

        const promoCode = new this.promoCodeModel({
            ...dto,
            code: dto.code.toUpperCase(),
        });

        return promoCode.save();
    }

    async findAll(): Promise<PromoCodeDocument[]> {
        return this.promoCodeModel.find().sort({ createdAt: -1 }).exec();
    }

    async findByCode(code: string): Promise<PromoCodeDocument | null> {
        return this.promoCodeModel.findOne({ code: code.toUpperCase() }).exec();
    }

    async update(id: string, dto: Partial<CreatePromoCodeDto>): Promise<PromoCodeDocument> {
        const promoCode = await this.promoCodeModel.findByIdAndUpdate(
            id,
            { ...dto, code: dto.code?.toUpperCase() },
            { new: true }
        ).exec();

        if (!promoCode) {
            throw new NotFoundException('Promo code not found');
        }

        return promoCode;
    }

    async delete(id: string): Promise<void> {
        const result = await this.promoCodeModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Promo code not found');
        }
    }

    async validate(userId: string, dto: ValidatePromoCodeDto): Promise<{
        valid: boolean;
        discountAmount: number;
        message: string;
        promoCode?: PromoCodeDocument;
    }> {
        const promoCode = await this.findByCode(dto.code);

        if (!promoCode) {
            return { valid: false, discountAmount: 0, message: 'Invalid promo code' };
        }

        // Check if active
        if (!promoCode.isActive) {
            return { valid: false, discountAmount: 0, message: 'This promo code is no longer active' };
        }

        // Check date validity
        const now = new Date();
        if (promoCode.validFrom && now < promoCode.validFrom) {
            return { valid: false, discountAmount: 0, message: 'This promo code is not yet valid' };
        }
        if (promoCode.validUntil && now > promoCode.validUntil) {
            return { valid: false, discountAmount: 0, message: 'This promo code has expired' };
        }

        // Check max uses
        if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
            return { valid: false, discountAmount: 0, message: 'This promo code has reached its usage limit' };
        }

        // Check user usage limit
        const userUsageCount = await this.usageModel.countDocuments({
            userId,
            promoCodeId: promoCode._id,
        });
        if (userUsageCount >= promoCode.maxUsesPerUser) {
            return { valid: false, discountAmount: 0, message: 'You have already used this promo code' };
        }

        // Check minimum order amount
        if (promoCode.minOrderAmount && dto.orderAmount < promoCode.minOrderAmount) {
            return {
                valid: false,
                discountAmount: 0,
                message: `Minimum order amount is ${promoCode.minOrderAmount}`,
            };
        }

        // Check applicable categories
        if (promoCode.applicableCategories && promoCode.applicableCategories.length > 0 && dto.categories) {
            const hasApplicableCategory = dto.categories.some(cat =>
                promoCode.applicableCategories.includes(cat)
            );
            if (!hasApplicableCategory) {
                return {
                    valid: false,
                    discountAmount: 0,
                    message: 'This promo code is not valid for the items in your cart',
                };
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (promoCode.discountType === 'percentage') {
            discountAmount = (dto.orderAmount * promoCode.discountValue) / 100;
            if (promoCode.maxDiscountAmount && discountAmount > promoCode.maxDiscountAmount) {
                discountAmount = promoCode.maxDiscountAmount;
            }
        } else {
            discountAmount = promoCode.discountValue;
            if (discountAmount > dto.orderAmount) {
                discountAmount = dto.orderAmount;
            }
        }

        discountAmount = Math.round(discountAmount * 100) / 100;

        return {
            valid: true,
            discountAmount,
            message: `Discount of ${discountAmount} applied!`,
            promoCode,
        };
    }

    async recordUsage(
        userId: string,
        promoCodeId: string,
        orderId: string,
        discountAmount: number,
    ): Promise<void> {
        // Record usage
        await this.usageModel.create({
            userId,
            promoCodeId,
            orderId,
            discountAmount,
        });

        // Increment usage count
        await this.promoCodeModel.findByIdAndUpdate(promoCodeId, {
            $inc: { currentUses: 1 },
        });
    }
}
