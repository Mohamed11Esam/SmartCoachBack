import { IsString, IsNumber, IsArray, IsOptional, IsEnum, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({ example: 'Whey Protein Powder' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Premium quality whey protein for muscle building' })
    @IsString()
    description: string;

    @ApiProperty({ example: 49.99 })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ example: 39.99 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @ApiPropertyOptional({ example: ['https://example.com/image1.jpg'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiProperty({ example: 'supplements', enum: ['supplements', 'equipment', 'apparel', 'accessories'] })
    @IsEnum(['supplements', 'equipment', 'apparel', 'accessories'])
    category: string;

    @ApiPropertyOptional({ example: 100 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    stock?: number;

    @ApiPropertyOptional({ example: 'WP-001' })
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiPropertyOptional({ example: { weight: '2.5kg', flavor: 'Chocolate' } })
    @IsOptional()
    specifications?: Record<string, string>;
}

export class UpdateProductDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiPropertyOptional({ enum: ['supplements', 'equipment', 'apparel', 'accessories'] })
    @IsOptional()
    @IsEnum(['supplements', 'equipment', 'apparel', 'accessories'])
    category?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    stock?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiPropertyOptional()
    @IsOptional()
    specifications?: Record<string, string>;
}
