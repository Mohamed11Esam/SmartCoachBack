import { Controller, Get, Put, Body, UseGuards, Request, Param, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.userId);
        const { passwordHash, ...result } = user.toObject();
        return result;
    }

    @Put('me')
    async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
        const user = await this.usersService.update(req.user.userId, updateUserDto);
        const { passwordHash, ...result } = user.toObject();
        return result;
    }

    @Put(':id/ban')
    @Roles('Admin')
    async banUser(@Param('id') id: string) {
        return this.usersService.update(id, { isBanned: true });
    }

    @Get()
    @Roles('Admin')
    async findAll() {
        // In a real app, add pagination here
        const users = await this.usersService.findAll();
        return users.map(user => {
            const { passwordHash, ...result } = user.toObject();
            return result;
        });
    }

    @Get(':id')
    @Roles('Admin')
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        const { passwordHash, ...result } = user.toObject();
        return result;
    }
}
