import { IsString, IsNumber, IsArray, IsEnum, IsOptional, Min, Max } from 'class-validator';

export enum FitnessLevel {
    BEGINNER = 'Beginner',
    INTERMEDIATE = 'Intermediate',
    ADVANCED = 'Advanced',
}

export class GenerateWorkoutDto {
    @IsEnum(FitnessLevel)
    fitnessLevel: FitnessLevel;

    @IsArray()
    @IsString({ each: true })
    goals: string[]; // e.g., ['muscle_gain', 'fat_loss', 'endurance']

    @IsNumber()
    @Min(15)
    @Max(120)
    duration: number; // minutes

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    equipment?: string[]; // e.g., ['dumbbells', 'barbell', 'bodyweight']

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    targetMuscles?: string[]; // e.g., ['chest', 'back', 'legs']
}
