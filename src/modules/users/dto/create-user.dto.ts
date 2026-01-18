import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    passwordHash: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEnum(['Customer', 'Coach', 'Admin'])
    @IsOptional()
    role?: string;
}
