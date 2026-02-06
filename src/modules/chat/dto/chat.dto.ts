import { IsString, IsOptional, IsEnum, IsMongoId, IsNumber } from 'class-validator';

export class SendMessageDto {
    @IsMongoId()
    conversationId: string;

    @IsString()
    content: string;

    @IsEnum(['text', 'image', 'file', 'audio'])
    @IsOptional()
    messageType?: string;

    @IsString()
    @IsOptional()
    fileUrl?: string;

    @IsString()
    @IsOptional()
    fileName?: string;

    @IsNumber()
    @IsOptional()
    fileSize?: number;

    @IsMongoId()
    @IsOptional()
    replyToId?: string;
}

export class StartConversationDto {
    @IsMongoId()
    recipientId: string;

    @IsString()
    @IsOptional()
    initialMessage?: string;
}

export class MarkReadDto {
    @IsMongoId()
    conversationId: string;

    @IsMongoId()
    @IsOptional()
    lastMessageId?: string;
}
