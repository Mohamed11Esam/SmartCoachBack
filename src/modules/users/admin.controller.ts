import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminController {
    constructor(private readonly usersService: UsersService) { }

    @Get('dashboard')
    async getDashboardStats() {
        return this.usersService.getDashboardStats();
    }
}
