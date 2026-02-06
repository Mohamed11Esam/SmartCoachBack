import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { NutritionService } from './nutrition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Nutrition')
@Controller('nutrition')
export class NutritionController {
    constructor(private readonly nutritionService: NutritionService) { }

    @Get()
    @ApiOperation({ summary: 'Get all meals with filters' })
    @ApiQuery({ name: 'mealType', required: false, description: 'Filter by meal type (Breakfast, Lunch, Dinner, Snack, Pre-Workout, Post-Workout)' })
    @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated, e.g., "High Protein,Keto")' })
    @ApiQuery({ name: 'search', required: false, description: 'Search in title, content, tags' })
    @ApiQuery({ name: 'minCalories', required: false, description: 'Minimum calories' })
    @ApiQuery({ name: 'maxCalories', required: false, description: 'Maximum calories' })
    @ApiQuery({ name: 'minProtein', required: false, description: 'Minimum protein (grams)' })
    async findAll(@Query() query: any) {
        return this.nutritionService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.nutritionService.findOne(id);
    }

    // Admin only in real app
    @Post()
    @Roles('Admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async create(@Body() createNutritionDto: any) {
        return this.nutritionService.create(createNutritionDto);
    }

    @Put(':id')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async update(@Param('id') id: string, @Body() updateDto: any) {
        return this.nutritionService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async delete(@Param('id') id: string) {
        return this.nutritionService.delete(id);
    }
}
