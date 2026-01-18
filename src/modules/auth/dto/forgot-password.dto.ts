import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty()
    otp: string;

    @ApiProperty({ example: 'newPassword123' })
    @IsString()
    @MinLength(6)
    newPassword: string;
}
