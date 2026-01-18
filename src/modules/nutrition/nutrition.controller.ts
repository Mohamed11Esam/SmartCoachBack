import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('nutrition')
export class NutritionController {
    constructor(private readonly nutritionService: NutritionService) { }

    @Get()
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
