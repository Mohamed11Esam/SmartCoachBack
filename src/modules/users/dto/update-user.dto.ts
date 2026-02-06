import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean, IsDateString } from 'class-validator';

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

    @IsDateString()
    @IsOptional()
    dateOfBirth?: string;

    @IsString()
    @IsOptional()
    @IsEnum(['Male', 'Female', 'Other'])
    gender?: string;

    @IsNumber()
    @IsOptional()
    height?: number;

    @IsNumber()
    @IsOptional()
    weight?: number;

    @IsString()
    @IsOptional()
    @IsEnum(['Lose Weight', 'Gain Muscle', 'Stay Fit', 'Build Strength', 'Improve Flexibility'])
    fitnessGoal?: string;

    @IsString()
    @IsOptional()
    @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
    fitnessLevel?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    healthConditions?: string[];

    @IsString()
    @IsOptional()
    @IsEnum(['Home', 'Gym', 'Both'])
    workoutLocation?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    preferredTrainingDays?: string[];

    @IsNumber()
    @IsOptional()
    preferredWorkoutDuration?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    dietaryPreferences?: string[];

    @IsBoolean()
    @IsOptional()
    onboardingCompleted?: boolean;

    @IsBoolean()
    @IsOptional()
    emailNotifications?: boolean;

    @IsBoolean()
    @IsOptional()
    pushNotifications?: boolean;

    // Admin only
    @IsBoolean()
    @IsOptional()
    isBanned?: boolean;
}
