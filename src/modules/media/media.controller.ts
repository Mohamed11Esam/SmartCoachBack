import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('presigned-url')
    async getPresignedUrl(@Body() body: { fileName: string; fileType: string }) {
        return this.mediaService.getPresignedUploadUrl(body.fileName, body.fileType);
    }
}
