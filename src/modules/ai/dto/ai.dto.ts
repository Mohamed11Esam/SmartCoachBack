import { IsString, IsObject, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';

export class ChatDto {
    @IsString()
    query: string;
}

export class GenerateMealPlanDto {
    @IsOptional()
    @IsString()
    diet?: string; // e.g., 'keto', 'vegan', 'balanced'

    @IsOptional()
    @IsNumber()
    @Min(1000)
    @Max(5000)
    targetCalories?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allergies?: string[];

    @IsOptional()
    @IsNumber()
    mealsPerDay?: number;
}

export class GeneratePlanDto {
    @IsObject()
    userData: {
        age?: number;
        weight?: number;
        height?: number;
        fitnessLevel?: string;
        goals?: string[];
    };
}
