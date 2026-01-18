import { Controller, Get, Post, Body, UseGuards, Request, Put, Param } from '@nestjs/common';
import { CoachProfileService } from './coach-profile.service';
import { CreateCoachProfileDto } from './dto/create-coach-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('coach-profile')
export class CoachProfileController {
    constructor(private readonly coachProfileService: CoachProfileService) { }

    @Post()
    @Roles('Coach')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async create(@Request() req, @Body() createCoachProfileDto: CreateCoachProfileDto) {
        return this.coachProfileService.create(req.user.userId, createCoachProfileDto);
    }

    @Get('me')
    @Roles('Coach')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getMyProfile(@Request() req) {
        return this.coachProfileService.findByUserId(req.user.userId);
    }

    @Put(':id')
    @Roles('Coach')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async update(@Param('id') id: string, @Body() updateDto: Partial<CreateCoachProfileDto>) {
        return this.coachProfileService.update(id, updateDto);
    }

    @Put(':id/verify')
    @Roles('Admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async verify(@Param('id') id: string) {
        return this.coachProfileService.update(id, { isVerified: true });
    }

    @Get()
    async findAll(@Request() req) {
        return this.coachProfileService.findAll(req.query);
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
