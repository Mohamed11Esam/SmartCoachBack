import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatDto, GenerateMealPlanDto, GeneratePlanDto } from './dto/ai.dto';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    @ApiOperation({ summary: 'Chat with AI assistant' })
    @ApiResponse({ status: 200, description: 'AI response returned successfully' })
    async chat(@Body() body: ChatDto) {
        return this.aiService.chat(body.query);
    }

    @Post('plan')
    @ApiOperation({ summary: 'Generate a fitness plan based on user data' })
    @ApiResponse({ status: 200, description: 'Fitness plan generated successfully' })
    async generatePlan(@Body() body: GeneratePlanDto) {
        return this.aiService.generatePlan(body.userData);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get AI chat history for current user' })
    @ApiResponse({ status: 200, description: 'Chat history returned successfully' })
    async getHistory(@Request() req) {
        return this.aiService.getHistory(req.user.userId);
    }

    @Post('meal-plan')
    @ApiOperation({ summary: 'Generate a personalized meal plan' })
    @ApiResponse({ status: 200, description: 'Meal plan generated successfully' })
    async generateMealPlan(@Body() body: GenerateMealPlanDto) {
        return this.aiService.generateMealPlan(body);
    }

    @Post('workout-plan')
    @ApiOperation({ summary: 'Generate a personalized workout plan' })
    @ApiResponse({ status: 200, description: 'Workout plan generated successfully' })
    async generateWorkoutPlan(@Body() body: GenerateWorkoutDto) {
        return this.aiService.generateWorkoutPlan(body);
    }
}
