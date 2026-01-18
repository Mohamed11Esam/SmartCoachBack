import { RegisterDto } from './dto/register.dto';
import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            if (user.isBanned) {
                return null; // Or handle as specific failure
            }
            const { passwordHash, ...result } = user.toObject();
            return result;
        }
        return null;
    }

    async login(user: any) {
        if (user.isBanned) {
            throw new UnauthorizedException('User is banned');
        }
        const payload = { email: user.email, sub: user._id, role: user.role, isVerified: user.isVerified };

        // Generate tokens
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.generateRefreshToken();

        // Hash and store refresh token
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersService.update(user._id.toString(), { refreshToken: hashedRefreshToken });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: user,
        };
    }

    async register(userData: RegisterDto) {
        const existingUser = await this.usersService.findByEmail(userData.email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(userData.password, salt);
        const newUser = await this.usersService.create({
            ...userData,
            passwordHash,
        });
        const { passwordHash: _, ...result } = newUser.toObject();
        return result;
    }

    generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    generateRefreshToken(): string {
        return crypto.randomBytes(64).toString('hex');
    }

    async sendOtp(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const otp = this.generateOtp();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

        await this.usersService.update(user._id.toString(), {
            otpSecret: otp,
            otpExpiry: otpExpiry,
        });

        // Send email (uses mock if SMTP not configured)
        await this.emailService.sendOtpEmail(email, otp);
        return { message: 'OTP sent successfully' };
    }

    async verifyOtp(email: string, otp: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.otpSecret !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        if (user.otpExpiry && new Date() > user.otpExpiry) {
            throw new BadRequestException('OTP expired');
        }

        await this.usersService.update(user._id.toString(), {
            isVerified: true,
            otpSecret: null,
            otpExpiry: null,
        });

        return { message: 'Email verified successfully' };
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access denied');
        }

        const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isRefreshTokenValid) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const payload = { email: user.email, sub: user._id, role: user.role, isVerified: user.isVerified };
        const newAccessToken = this.jwtService.sign(payload);
        const newRefreshToken = this.generateRefreshToken();

        const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
        await this.usersService.update(userId, { refreshToken: hashedRefreshToken });

        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
        };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists for security
            return { message: 'If the email exists, a reset OTP has been sent' };
        }

        const otp = this.generateOtp();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 15); // 15 min expiry for password reset

        await this.usersService.update(user._id.toString(), {
            otpSecret: otp,
            otpExpiry: otpExpiry,
        });

        // Send password reset email
        await this.emailService.sendPasswordResetEmail(email, otp);
        return { message: 'If the email exists, a reset OTP has been sent' };
    }

    async resetPassword(email: string, otp: string, newPassword: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.otpSecret !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        if (user.otpExpiry && new Date() > user.otpExpiry) {
            throw new BadRequestException('OTP expired');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await this.usersService.update(user._id.toString(), {
            passwordHash,
            otpSecret: null,
            otpExpiry: null,
            refreshToken: null, // Invalidate all sessions
        });

        return { message: 'Password reset successfully' };
    }

    async logout(userId: string) {
        await this.usersService.update(userId, { refreshToken: null });
        return { message: 'Logged out successfully' };
    }
}

