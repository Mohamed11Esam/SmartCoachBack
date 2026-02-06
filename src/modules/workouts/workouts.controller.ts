import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Workouts')
@Controller('workouts')
export class WorkoutsController {
    constructor(private readonly workoutsService: WorkoutsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all workouts with filters' })
    @ApiQuery({ name: 'category', required: false, description: 'Filter by category (Strength, Cardio, Yoga, Stretching, HIIT, CrossFit, Pilates)' })
    @ApiQuery({ name: 'difficulty', required: false, description: 'Filter by difficulty (Beginner, Intermediate, Advanced)' })
    @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
    @ApiQuery({ name: 'search', required: false, description: 'Search in title, description, tags' })
    @ApiQuery({ name: 'minDuration', required: false, description: 'Minimum duration in minutes' })
    @ApiQuery({ name: 'maxDuration', required: false, description: 'Maximum duration in minutes' })
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
