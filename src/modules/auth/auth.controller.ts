import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @UseGuards(LocalAuthGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto, @Request() req) {
        return this.authService.login(req.user);
    }

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registrations per minute
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('send-otp')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 OTP requests per minute
    @ApiOperation({ summary: 'Send OTP to email for verification' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    async sendOtp(@Body() body: { email: string }) {
        return this.authService.sendOtp(body.email);
    }

    @Post('verify-otp')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    @ApiOperation({ summary: 'Verify OTP code' })
    @ApiResponse({ status: 200, description: 'Email verified successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
    async verifyOtp(@Body() body: { email: string; otp: string }) {
        return this.authService.verifyOtp(body.email, body.otp);
    }

    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
    @ApiOperation({ summary: 'Request password reset OTP' })
    @ApiResponse({ status: 200, description: 'Password reset OTP sent if email exists' })
    async forgotPassword(@Body() body: ForgotPasswordDto) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    @ApiOperation({ summary: 'Reset password using OTP' })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
    async resetPassword(@Body() body: ResetPasswordDto) {
        return this.authService.resetPassword(body.email, body.otp, body.newPassword);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token using refresh token' })
    @ApiResponse({ status: 200, description: 'New tokens generated' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshTokens(@Body() body: { userId: string; refreshToken: string }) {
        return this.authService.refreshTokens(body.userId, body.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout and invalidate refresh token' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    async logout(@Request() req) {
        return this.authService.logout(req.user.userId);
    }
}

