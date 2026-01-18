import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    @IsString()
    productId: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @Min(1)
    quantity: number;
}

export class UpdateCartItemDto {
    @ApiProperty({ example: 2 })
    @IsNumber()
    @Min(0)
    quantity: number;
}

export class ShippingAddressDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    name: string;

    @ApiProperty({ example: '123 Main St' })
    @IsString()
    street: string;

    @ApiProperty({ example: 'New York' })
    @IsString()
    city: string;

    @ApiProperty({ example: 'NY' })
    @IsString()
    state: string;

    @ApiProperty({ example: '10001' })
    @IsString()
    zipCode: string;

    @ApiProperty({ example: 'USA' })
    @IsString()
    country: string;

    @ApiProperty({ example: '+1234567890' })
    @IsString()
    phone: string;
}

export class CheckoutDto {
    @ApiProperty({ type: ShippingAddressDto })
    @ValidateNested()
    @Type(() => ShippingAddressDto)
    shippingAddress: ShippingAddressDto;

    @ApiPropertyOptional({ example: 'Leave at the door' })
    @IsOptional()
    @IsString()
    notes?: string;
}
