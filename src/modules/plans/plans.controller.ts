import { Controller, Post, Body, UseGuards, Request, Put, Param, Get } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    @Post()
    @Roles('Coach')
    async create(@Body() dto: CreatePlanDto) {
        return this.plansService.create(dto);
    }

    @Put(':id')
    @Roles('Coach')
    async update(@Param('id') id: string, @Body() body: { days: any[] }) {
        return this.plansService.updatePlan(id, body.days);
    }

    @Get('active')
    async getActivePlan(@Request() req) {
        return this.plansService.getActivePlan(req.user.userId);
    }
}
