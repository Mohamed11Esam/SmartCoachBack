import { IsString, IsOptional, IsEnum, IsNumber, IsObject } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    photoUrl?: string;

    @IsString()
    @IsOptional()
    @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
    fitnessLevel?: string;

    @IsString()
    @IsOptional()
    goal?: string;

    @IsNumber()
    @IsOptional()
    height?: number;

    @IsNumber()
    @IsOptional()
    weight?: number;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsNumber()
    @IsOptional()
    age?: number;

    @IsObject()
    @IsOptional()
    preferences?: Record<string, any>;
}
