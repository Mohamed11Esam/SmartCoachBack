import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class MediaService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
        });
    }

    async getPresignedUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'fitglow-uploads';
        const publicId = `${folder}/${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`;

        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp,
                folder,
                public_id: publicId,
            },
            this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
        );

        const cloudName = this.configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
        const resourceType = fileType.startsWith('video/') ? 'video' : 'image';
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

        // Return the upload URL and params the client needs
        // The client will POST form-data to uploadUrl with these params
        const fileUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}`;

        return {
            uploadUrl,
            fileUrl,
            // Extra fields the client needs for the upload
            ...({
                apiKey: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
                timestamp,
                signature,
                publicId,
                folder,
            } as any),
        };
    }

    async uploadFromBuffer(buffer: Buffer, fileName: string, fileType: string): Promise<string> {
        const resourceType = fileType.startsWith('video/') ? 'video' : 'image';

        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: resourceType as 'image' | 'video',
                    folder: 'fitglow-uploads',
                    public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`,
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result!.secure_url);
                },
            ).end(buffer);
        });
    }
}
