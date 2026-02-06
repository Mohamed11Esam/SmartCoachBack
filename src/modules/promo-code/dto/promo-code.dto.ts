import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString, Min, Max } from 'class-validator';

export class CreatePromoCodeDto {
    @IsString()
    code: string;

    @IsEnum(['percentage', 'fixed'])
    discountType: 'percentage' | 'fixed';

    @IsNumber()
    @Min(0)
    discountValue: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    minOrderAmount?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    maxDiscountAmount?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxUses?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    maxUsesPerUser?: number;

    @IsDateString()
    @IsOptional()
    validFrom?: string;

    @IsDateString()
    @IsOptional()
    validUntil?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    applicableCategories?: string[];
}

export class ValidatePromoCodeDto {
    @IsString()
    code: string;

    @IsNumber()
    @Min(0)
    orderAmount: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categories?: string[];
}
