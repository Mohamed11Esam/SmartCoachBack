import { IsString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class WorkoutItemDto {
    @IsString()
    workoutId: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

class MealItemDto {
    @IsString()
    nutritionId: string;

    @IsString()
    @IsEnum(['Breakfast', 'Lunch', 'Dinner', 'Snack'])
    type: string;
}

class DayPlanDto {
    @IsNumber()
    dayNumber: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkoutItemDto)
    workouts: WorkoutItemDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MealItemDto)
    meals: MealItemDto[];
}

export class CreatePlanDto {
    @IsString()
    userId: string; // The customer ID

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DayPlanDto)
    days: DayPlanDto[];
}
