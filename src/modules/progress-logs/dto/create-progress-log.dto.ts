import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProgressLogDto {
    @IsOptional()
    @IsString()
    planId?: string;

    @IsOptional()
    @IsString()
    workoutId?: string;

    @IsOptional()
    @IsString()
    workoutTitle?: string;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsOptional()
    @IsString()
    exerciseId?: string;

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
    @IsNumber()
    volume?: number;

    @IsOptional()
    @IsNumber()
    rpe?: number;

    @IsOptional()
    @IsNumber()
    durationMinutes?: number;

    @IsOptional()
    @IsNumber()
    caloriesBurned?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}

export class CompletedExerciseItemDto {
    @IsOptional()
    @IsString()
    exerciseId?: string;

    @IsNotEmpty()
    @IsString()
    exerciseName: string;

    @IsNumber()
    sets: number;

    @IsNumber()
    reps: number;

    @IsNumber()
    weight: number;

    @IsOptional()
    @IsNumber()
    rpe?: number;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class WorkoutSessionLogDto {
    @IsOptional()
    @IsString()
    workoutId?: string;

    @IsNotEmpty()
    @IsString()
    workoutTitle: string;

    @IsOptional()
    @IsNumber()
    durationMinutes?: number;

    @IsOptional()
    @IsNumber()
    caloriesBurned?: number;

    @IsOptional()
    @IsNumber()
    totalVolume?: number;

    @IsOptional()
    @IsDateString()
    date?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CompletedExerciseItemDto)
    completedExercises: CompletedExerciseItemDto[];
}
