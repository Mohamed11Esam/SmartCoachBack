import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsDateString, IsMongoId, Min, Max, Matches } from 'class-validator';

// Time format validation (HH:MM)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateTimeSlotDto {
    @IsNumber()
    @Min(0)
    @Max(6)
    dayOfWeek: number; // 0-6

    @IsString()
    @Matches(timeRegex, { message: 'startTime must be in HH:MM format (24h)' })
    startTime: string;

    @IsString()
    @Matches(timeRegex, { message: 'endTime must be in HH:MM format (24h)' })
    endTime: string;

    @IsBoolean()
    @IsOptional()
    isRecurring?: boolean;

    @IsDateString()
    @IsOptional()
    specificDate?: string;

    @IsEnum(['online', 'in-person', 'both'])
    @IsOptional()
    sessionType?: string;

    @IsNumber()
    @IsOptional()
    @Min(15)
    @Max(180)
    duration?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateTimeSlotDto {
    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @IsString()
    @Matches(timeRegex, { message: 'startTime must be in HH:MM format (24h)' })
    @IsOptional()
    startTime?: string;

    @IsString()
    @Matches(timeRegex, { message: 'endTime must be in HH:MM format (24h)' })
    @IsOptional()
    endTime?: string;

    @IsEnum(['online', 'in-person', 'both'])
    @IsOptional()
    sessionType?: string;

    @IsNumber()
    @IsOptional()
    duration?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class BookSessionDto {
    @IsMongoId()
    coachId: string;

    @IsDateString()
    scheduledDate: string;

    @IsString()
    @Matches(timeRegex, { message: 'startTime must be in HH:MM format (24h)' })
    startTime: string;

    @IsString()
    @Matches(timeRegex, { message: 'endTime must be in HH:MM format (24h)' })
    endTime: string;

    @IsEnum(['online', 'in-person'])
    @IsOptional()
    sessionType?: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsMongoId()
    @IsOptional()
    timeSlotId?: string;
}

export class UpdateSessionDto {
    @IsEnum(['scheduled', 'confirmed', 'in-progress', 'completed', 'canceled', 'no-show'])
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    coachNotes?: string;

    @IsString()
    @IsOptional()
    clientNotes?: string;

    @IsString()
    @IsOptional()
    meetingLink?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    cancelReason?: string;
}

export class GetAvailabilityDto {
    @IsMongoId()
    coachId: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;
}
