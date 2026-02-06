import { Controller, Get, Post, Body, UseGuards, Request, Put, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CoachProfileService } from './coach-profile.service';
import { CreateCoachProfileDto } from './dto/create-coach-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Coach Profile')
@Controller('coach-profile')
export class CoachProfileController {
    constructor(private readonly coachProfileService: CoachProfileService) { }

    @Post()
    @Roles('Coach')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create coach profile (Coach)' })
    async create(@Request() req, @Body() createCoachProfileDto: CreateCoachProfileDto) {
        return this.coachProfileService.create(req.user.userId, createCoachProfileDto);
    }

    @Get('me')
    @Roles('Coach')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my coach profile (Coach)' })
    async getMyProfile(@Request() req) {
        return this.coachProfileService.findByUserId(req.user.userId);
    }

    @Put(':id')
    @Roles('Coach')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update coach profile (Coach)' })
    async update(@Param('id') id: string, @Body() updateDto: Partial<CreateCoachProfileDto>) {
        return this.coachProfileService.update(id, updateDto);
    }

    @Put(':id/verify')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify a coach profile (Admin)' })
    async verify(@Param('id') id: string) {
        return this.coachProfileService.update(id, { isVerified: true });
    }

    @Get()
    @ApiOperation({ summary: 'Get all coaches with filters' })
    @ApiQuery({ name: 'search', required: false, description: 'Search by name' })
    @ApiQuery({ name: 'specialty', required: false, description: 'Filter by specialty (Fitness, Nutrition, Yoga, etc.)' })
    @ApiQuery({ name: 'isVerified', required: false, description: 'Filter by verified status' })
    @ApiQuery({ name: 'minRating', required: false, description: 'Minimum average rating' })
    async findAll(
        @Query('search') search?: string,
        @Query('specialty') specialty?: string,
        @Query('isVerified') isVerified?: string,
        @Query('minRating') minRating?: string,
    ) {
        return this.coachProfileService.findAll({
            search,
            specialties: specialty,
            isVerified,
            minRating: minRating ? parseFloat(minRating) : undefined,
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.coachProfileService.findOne(id);
    }

    @Post(':id/rate')
    @UseGuards(JwtAuthGuard)
    async rateCoach(@Param('id') id: string, @Body() body: { rating: number; comment: string }, @Request() req) {
        return this.coachProfileService.addReview(id, req.user.userId, body.rating, body.comment);
    }

    @Get(':id/reviews')
    async getReviews(@Param('id') id: string) {
        return this.coachProfileService.getReviews(id);
    }
}
