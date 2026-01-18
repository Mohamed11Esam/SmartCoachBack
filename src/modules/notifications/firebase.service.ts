import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private isConfigured = false;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const credentialsPath = this.configService.get<string>('FIREBASE_CREDENTIALS_PATH');

        if (credentialsPath) {
            try {
                // Try to resolve path relative to project root
                const resolvedPath = path.resolve(process.cwd(), credentialsPath);

                if (fs.existsSync(resolvedPath)) {
                    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));

                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });

                    this.isConfigured = true;
                    console.log('🔥 Firebase Admin SDK initialized');
                } else {
                    console.warn(`⚠️ Firebase credentials file not found at: ${resolvedPath}. Push notifications will be mocked.`);
                }
            } catch (error) {
                console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
            }
        } else {
            console.warn('⚠️ FIREBASE_CREDENTIALS_PATH not set. Push notifications will be mocked.');
        }
    }

    async sendToDevice(tokens: string[], title: string, body: string, data?: Record<string, any>): Promise<void> {
        if (!tokens || tokens.length === 0) return;

        if (!this.isConfigured) {
            console.log(`[MOCK FCM] Sending "${title}" to ${tokens.length} devices`);
            return;
        }

        try {
            // Clean tokens (remove empty/null)
            const validTokens = tokens.filter(t => t && t.trim().length > 0);

            if (validTokens.length === 0) return;

            // Send multicast message
            const response = await admin.messaging().sendEachForMulticast({
                tokens: validTokens,
                notification: {
                    title,
                    body,
                },
                data: data ? this.stringifyData(data) : {},
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        },
                    },
                },
            });

            if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(validTokens[idx]);
                    }
                });
                console.warn(`⚠️ ${response.failureCount} FCM messages failed. Failed tokens:`, failedTokens);
                // TODO: Could implement token cleanup for invalid tokens here
            }
        } catch (error) {
            console.error('❌ Error sending FCM message:', error);
        }
    }

    // FCM data payload values must be strings
    private stringifyData(data: Record<string, any>): Record<string, string> {
        return Object.keys(data).reduce((acc, key) => {
            const value = data[key];
            if (typeof value === 'object') {
                acc[key] = JSON.stringify(value);
            } else {
                acc[key] = String(value);
            }
            return acc;
        }, {});
    }
}
