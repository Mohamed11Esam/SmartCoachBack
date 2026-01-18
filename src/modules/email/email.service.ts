import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private isConfigured: boolean = false;

    constructor(private configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port: port || 587,
                secure: port === 465,
                auth: { user, pass },
            });
            this.isConfigured = true;
        }
    }

    async sendOtpEmail(to: string, otp: string): Promise<boolean> {
        if (!this.isConfigured) {
            // Mock mode - log to console
            console.log(`[MOCK EMAIL] OTP for ${to}: ${otp}`);
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('EMAIL_FROM') || 'noreply@aicoach.com',
                to,
                subject: 'Your AI Coach Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Verify Your Email</h2>
                        <p>Your verification code is:</p>
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p style="color: #666;">This code expires in 10 minutes.</p>
                        <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
                    </div>
                `,
            });
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
        if (!this.isConfigured) {
            console.log(`[MOCK EMAIL] Welcome email for ${to}`);
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('EMAIL_FROM') || 'noreply@aicoach.com',
                to,
                subject: 'Welcome to AI Coach!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Welcome, ${name}!</h2>
                        <p>Thank you for joining AI Coach. We're excited to help you achieve your fitness goals.</p>
                        <p>Get started by:</p>
                        <ul>
                            <li>Exploring our workout library</li>
                            <li>Chatting with our AI assistant</li>
                            <li>Finding a coach that fits your needs</li>
                        </ul>
                        <p>See you at the gym!</p>
                    </div>
                `,
            });
            return true;
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            return false;
        }
    }

    async sendNotificationEmail(to: string, title: string, body: string): Promise<boolean> {
        if (!this.isConfigured) {
            console.log(`[MOCK EMAIL] Notification for ${to}: ${title}`);
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('EMAIL_FROM') || 'noreply@aicoach.com',
                to,
                subject: `AI Coach: ${title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">${title}</h2>
                        <p>${body}</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;" />
                        <p style="color: #666; font-size: 12px;">
                            You received this email because you have notifications enabled.
                            <a href="#">Manage preferences</a>
                        </p>
                    </div>
                `,
            });
            return true;
        } catch (error) {
            console.error('Failed to send notification email:', error);
            return false;
        }
    }

    async sendPasswordResetEmail(to: string, otp: string): Promise<boolean> {
        if (!this.isConfigured) {
            console.log(`[MOCK EMAIL] Password Reset OTP for ${to}: ${otp}`);
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('EMAIL_FROM') || 'noreply@aicoach.com',
                to,
                subject: 'Reset Your AI Coach Password',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Reset Your Password</h2>
                        <p>You requested to reset your password. Use the code below:</p>
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p style="color: #666;">This code expires in 15 minutes.</p>
                        <p style="color: #666;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                    </div>
                `,
            });
            return true;
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            return false;
        }
    }
}

