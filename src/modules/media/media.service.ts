import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class MediaService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(private configService: ConfigService) {
        this.s3Client = new S3Client({
            region: this.configService.getOrThrow<string>('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
            },
        });
        this.bucketName = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    }

    async getPresignedUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
        const key = `uploads/${Date.now()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        const fileUrl = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;

        return { uploadUrl, fileUrl };
    }
}
