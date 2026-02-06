import { IsString, IsOptional, IsEnum, IsMongoId } from 'class-validator';

export class CreateClientRequestDto {
    @IsMongoId()
    coachId: string;

    @IsString()
    @IsOptional()
    message?: string;

    @IsEnum(['online', 'in-person', 'both'])
    @IsOptional()
    trainingType?: string;
}

export class RespondToRequestDto {
    @IsEnum(['accepted', 'rejected'])
    status: 'accepted' | 'rejected';

    @IsString()
    @IsOptional()
    rejectionReason?: string;
}

export class UpdateClientDto {
    @IsString()
    @IsOptional()
    notes?: string;

    @IsOptional()
    progressPercentage?: number;
}
