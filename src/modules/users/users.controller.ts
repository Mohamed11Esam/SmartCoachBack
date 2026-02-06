import { Controller, Get, Put, Post, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.userId);
        const { passwordHash, refreshToken, otpSecret, ...result } = user.toObject();
        return result;
    }

    @Put('me')
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
        const user = await this.usersService.update(req.user.userId, updateUserDto);
        const { passwordHash, refreshToken, otpSecret, ...result } = user.toObject();
        return result;
    }

    // ── Saved Items ──

    @Get('saved')
    @ApiOperation({ summary: 'Get saved workouts and meals' })
    async getSavedItems(@Request() req) {
        return this.usersService.getSavedItems(req.user.userId);
    }

    @Post('saved/workouts/:workoutId')
    @ApiOperation({ summary: 'Save a workout' })
    async saveWorkout(@Request() req, @Param('workoutId') workoutId: string) {
        await this.usersService.saveWorkout(req.user.userId, workoutId);
        return { message: 'Workout saved', workoutId };
    }

    @Delete('saved/workouts/:workoutId')
    @ApiOperation({ summary: 'Unsave a workout' })
    async unsaveWorkout(@Request() req, @Param('workoutId') workoutId: string) {
        await this.usersService.unsaveWorkout(req.user.userId, workoutId);
        return { message: 'Workout removed from saved', workoutId };
    }

    @Post('saved/meals/:mealId')
    @ApiOperation({ summary: 'Save a meal' })
    async saveMeal(@Request() req, @Param('mealId') mealId: string) {
        await this.usersService.saveMeal(req.user.userId, mealId);
        return { message: 'Meal saved', mealId };
    }

    @Delete('saved/meals/:mealId')
    @ApiOperation({ summary: 'Unsave a meal' })
    async unsaveMeal(@Request() req, @Param('mealId') mealId: string) {
        await this.usersService.unsaveMeal(req.user.userId, mealId);
        return { message: 'Meal removed from saved', mealId };
    }

    // ── Admin Routes ──

    @Put(':id/ban')
    @Roles('Admin')
    @ApiOperation({ summary: 'Ban a user (Admin only)' })
    async banUser(@Param('id') id: string) {
        return this.usersService.update(id, { isBanned: true });
    }

    @Get()
    @Roles('Admin')
    @ApiOperation({ summary: 'Get all users (Admin only)' })
    async findAll() {
        const users = await this.usersService.findAll();
        return users.map(user => {
            const { passwordHash, refreshToken, otpSecret, ...result } = user.toObject();
            return result;
        });
    }

    @Get(':id')
    @Roles('Admin')
    @ApiOperation({ summary: 'Get user by ID (Admin only)' })
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        const { passwordHash, refreshToken, otpSecret, ...result } = user.toObject();
        return result;
    }
}
