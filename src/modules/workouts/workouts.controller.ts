import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('workouts')
export class WorkoutsController {
    constructor(private readonly workoutsService: WorkoutsService) { }

    @Get()
    async findAll(@Query() query: any) {
        return this.workoutsService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.workoutsService.findOne(id);
    }

    @Post()
    @Roles('Admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async create(@Body() createWorkoutDto: any) {
        return this.workoutsService.create(createWorkoutDto);
    }

    @Put(':id')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async update(@Param('id') id: string, @Body() updateDto: any) {
        return this.workoutsService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async delete(@Param('id') id: string) {
        return this.workoutsService.delete(id);
    }
}
