import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AxiosError } from 'axios';
import { ChatService } from '../chat/chat.service';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';

@Injectable()
export class AiService {
    private readonly aiServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly chatService: ChatService,
    ) {
        this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    }

    async chat(query: string) {
        const { data } = await firstValueFrom(
            this.httpService.post(`${this.aiServiceUrl}/rag/query`, { query }).pipe(
                catchError((error: AxiosError) => {
                    throw new HttpException(
                        error.response?.data || 'AI Service Error',
                        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }),
            ),
        );
        return data;
    }

    async generatePlan(userData: any) {
        const { data } = await firstValueFrom(
            this.httpService.post(`${this.aiServiceUrl}/rag/plan`, { user_data: userData }).pipe(
                catchError((error: AxiosError) => {
                    throw new HttpException(
                        error.response?.data || 'AI Service Error',
                        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }),
            ),
        );
        return data;
    }

    async getHistory(userId: string) {
        // Get user's AI chat conversations from ChatService
        const conversations = await this.chatService.getUserConversations(userId);
        return conversations.map(conv => ({
            id: conv._id,
            title: conv.lastMessage?.substring(0, 50) || 'Chat Session',
            date: conv.lastMessageAt || (conv as any).createdAt,
        }));
    }

    async generateMealPlan(preferences: any) {
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/rag/meal-plan`, { preferences }).pipe(
                    catchError((error: AxiosError) => {
                        throw new HttpException(
                            error.response?.data || 'AI Service Error',
                            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                        );
                    }),
                ),
            );
            return data;
        } catch (error) {
            // Fallback to structured response if AI service is unavailable
            if (error instanceof HttpException && error.getStatus() === HttpStatus.SERVICE_UNAVAILABLE) {
                return {
                    title: 'Personalized Meal Plan',
                    preferences,
                    meals: [
                        { type: 'Breakfast', name: 'Oatmeal with Berries', calories: 350 },
                        { type: 'Lunch', name: 'Grilled Chicken Salad', calories: 450 },
                        { type: 'Dinner', name: 'Salmon with Asparagus', calories: 500 },
                        { type: 'Snack', name: 'Greek Yogurt', calories: 150 }
                    ],
                    note: 'AI service temporarily unavailable - showing default plan'
                };
            }
            throw error;
        }
    }

    async generateWorkoutPlan(preferences: GenerateWorkoutDto) {
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/rag/workout-plan`, { preferences }).pipe(
                    catchError((error: AxiosError) => {
                        throw new HttpException(
                            error.response?.data || 'AI Service Error',
                            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                        );
                    }),
                ),
            );
            return data;
        } catch (error) {
            // Fallback to structured response if AI service is unavailable
            if (error instanceof HttpException &&
                (error.getStatus() === HttpStatus.SERVICE_UNAVAILABLE ||
                    error.getStatus() === HttpStatus.INTERNAL_SERVER_ERROR)) {
                return this.generateFallbackWorkout(preferences);
            }
            throw error;
        }
    }

    private generateFallbackWorkout(preferences: GenerateWorkoutDto) {
        const exercises = {
            Beginner: [
                { name: 'Bodyweight Squats', sets: 3, reps: 12, rest: '60s' },
                { name: 'Push-ups (Knee)', sets: 3, reps: 10, rest: '60s' },
                { name: 'Plank', sets: 3, reps: '30s hold', rest: '45s' },
                { name: 'Walking Lunges', sets: 2, reps: 10, rest: '60s' },
            ],
            Intermediate: [
                { name: 'Goblet Squats', sets: 4, reps: 12, rest: '60s' },
                { name: 'Push-ups', sets: 4, reps: 15, rest: '45s' },
                { name: 'Dumbbell Rows', sets: 3, reps: 12, rest: '60s' },
                { name: 'Plank', sets: 3, reps: '45s hold', rest: '45s' },
                { name: 'Lunges', sets: 3, reps: 12, rest: '60s' },
            ],
            Advanced: [
                { name: 'Barbell Squats', sets: 4, reps: 10, rest: '90s' },
                { name: 'Bench Press', sets: 4, reps: 10, rest: '90s' },
                { name: 'Deadlifts', sets: 4, reps: 8, rest: '120s' },
                { name: 'Pull-ups', sets: 4, reps: 10, rest: '90s' },
                { name: 'Overhead Press', sets: 3, reps: 10, rest: '90s' },
            ],
        };

        return {
            title: `${preferences.fitnessLevel} Workout Plan`,
            fitnessLevel: preferences.fitnessLevel,
            duration: preferences.duration,
            goals: preferences.goals,
            warmup: {
                duration: '5-10 minutes',
                exercises: ['Light cardio', 'Dynamic stretching', 'Joint rotations']
            },
            workout: {
                exercises: exercises[preferences.fitnessLevel] || exercises.Beginner,
            },
            cooldown: {
                duration: '5 minutes',
                exercises: ['Static stretching', 'Deep breathing']
            },
            note: 'AI service temporarily unavailable - showing default workout'
        };
    }
}
