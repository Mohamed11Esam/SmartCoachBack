import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateProgressLogDto {
    @IsNotEmpty()
    @IsString()
    planId: string;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsNotEmpty()
    @IsString()
    exerciseName: string;

    @IsOptional()
    @IsNumber()
    sets?: number;

    @IsOptional()
    @IsNumber()
    reps?: number;

    @IsOptional()
    @IsNumber()
    weight?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}
