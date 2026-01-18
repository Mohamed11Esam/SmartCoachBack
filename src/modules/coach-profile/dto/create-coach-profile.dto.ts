import { IsString, IsArray, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateCoachProfileDto {
    @IsString()
    bio: string;

    @IsArray()
    @IsString({ each: true })
    specialties: string[];

    @IsNumber()
    experienceYears: number;

    @IsArray()
    @IsString({ each: true })
    certifications: string[];

    @IsOptional()
    @IsObject()
    socialLinks?: Record<string, string>;

    @IsOptional()
    isVerified?: boolean;
}
