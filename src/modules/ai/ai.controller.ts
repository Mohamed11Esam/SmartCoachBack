import { Controller, Post, Body, UseGuards, Get, Patch, Delete, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatDto, CreateAiSessionDto, UpdateAiSessionDto, GenerateMealPlanDto, GeneratePlanDto } from './dto/ai.dto';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    @ApiOperation({ summary: 'Chat with AI assistant and record in session' })
    @ApiResponse({ status: 200, description: 'AI response returned successfully' })
    async chat(@Body() body: ChatDto, @Request() req) {
        return this.aiService.chat(body.query, req.user?.userId, body.sessionId);
    }

    @Get('sessions')
    @ApiOperation({ summary: 'Get all AI chat sessions for current athlete' })
    @ApiResponse({ status: 200, description: 'List of AI sessions' })
    async getSessions(@Request() req) {
        return this.aiService.getUserSessions(req.user.userId);
    }

    @Post('sessions')
    @ApiOperation({ summary: 'Create a new AI chat session' })
    @ApiResponse({ status: 201, description: 'AI session created' })
    async createSession(@Body() body: CreateAiSessionDto, @Request() req) {
        return this.aiService.createSession(req.user.userId, body.title);
    }

    @Get('sessions/:id')
    @ApiOperation({ summary: 'Get single AI chat session with full message thread' })
    @ApiResponse({ status: 200, description: 'AI session details' })
    async getSession(@Param('id') id: string, @Request() req) {
        return this.aiService.getSessionById(req.user.userId, id);
    }

    @Patch('sessions/:id')
    @ApiOperation({ summary: 'Rename AI chat session' })
    @ApiResponse({ status: 200, description: 'AI session updated' })
    async renameSession(@Param('id') id: string, @Body() body: UpdateAiSessionDto, @Request() req) {
        return this.aiService.renameSession(req.user.userId, id, body.title);
    }

    @Delete('sessions/:id')
    @ApiOperation({ summary: 'Delete AI chat session' })
    @ApiResponse({ status: 200, description: 'AI session deleted' })
    async deleteSession(@Param('id') id: string, @Request() req) {
        return this.aiService.deleteSession(req.user.userId, id);
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
