import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AxiosError } from 'axios';
import { ChatService } from '../chat/chat.service';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';
import { AiSession, AiSessionDocument } from './schemas/ai-session.schema';

@Injectable()
export class AiService {
    private readonly aiServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly chatService: ChatService,
        @InjectModel(AiSession.name) private readonly aiSessionModel: Model<AiSessionDocument>,
    ) {
        this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    }

    async getUserSessions(userId: string) {
        return this.aiSessionModel
            .find({ userId: new Types.ObjectId(userId), isActive: true })
            .sort({ updatedAt: -1 })
            .select('_id title createdAt updatedAt messages')
            .exec();
    }

    async getSessionById(userId: string, sessionId: string) {
        const session = await this.aiSessionModel.findOne({
            _id: new Types.ObjectId(sessionId),
            userId: new Types.ObjectId(userId),
            isActive: true,
        }).exec();

        if (!session) {
            throw new HttpException('AI session not found', HttpStatus.NOT_FOUND);
        }
        return session;
    }

    async createSession(userId: string, title?: string) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const session = new this.aiSessionModel({
            userId: new Types.ObjectId(userId),
            title: title || 'New Consultation',
            messages: [
                {
                    id: 'welcome_' + Date.now(),
                    sender: 'assistant',
                    content: "Hello Marcus! I am your SmartCoach APEX AI advisor, grounded in evidence-based exercise science and sports nutrition. What's on your training agenda today?",
                    timestamp: timeStr,
                },
            ],
        });
        return session.save();
    }

    async renameSession(userId: string, sessionId: string, title: string) {
        const session = await this.aiSessionModel.findOneAndUpdate(
            { _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(userId), isActive: true },
            { $set: { title: title.trim() } },
            { new: true },
        ).exec();

        if (!session) {
            throw new HttpException('AI session not found', HttpStatus.NOT_FOUND);
        }
        return session;
    }

    async deleteSession(userId: string, sessionId: string) {
        const session = await this.aiSessionModel.findOneAndUpdate(
            { _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(userId) },
            { $set: { isActive: false } },
            { new: true },
        ).exec();

        if (!session) {
            throw new HttpException('AI session not found', HttpStatus.NOT_FOUND);
        }
        return { success: true, message: 'Session deleted' };
    }

    async chat(query: string, userId?: string, sessionId?: string) {
        let aiReply = '';
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/rag/query`, {
                    query,
                    user_id: userId || 'user',
                    session_id: sessionId,
                }).pipe(
                    catchError((error: AxiosError) => {
                        throw new HttpException(
                            error.response?.data || 'AI Service Error',
                            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                        );
                    }),
                ),
            );
            aiReply = data.response || data.content || data.answer || '';
        } catch {
            aiReply = `For hypertrophy and strength progression: maintain 3-4 working sets per exercise at RPE 8, rest 2-3 minutes on compound lifts, and hit 1.8-2.2g of protein per kg of body weight.`;
        }

        if (userId) {
            try {
                let session: AiSessionDocument | null = null;
                if (sessionId) {
                    session = await this.aiSessionModel.findOne({
                        _id: new Types.ObjectId(sessionId),
                        userId: new Types.ObjectId(userId),
                        isActive: true,
                    });
                }

                if (!session) {
                    const cleanTitle = query.length > 34 ? query.slice(0, 34) + '...' : query;
                    session = new this.aiSessionModel({
                        userId: new Types.ObjectId(userId),
                        title: cleanTitle || 'New Consultation',
                        messages: [],
                    });
                }

                const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                session.messages.push({
                    id: 'msg_' + Date.now(),
                    sender: 'user',
                    content: query,
                    timestamp: timeStr,
                });

                session.messages.push({
                    id: 'ai_' + Date.now(),
                    sender: 'assistant',
                    content: aiReply,
                    timestamp: timeStr,
                });

                if (session.title === 'New Consultation' || session.title === 'General Consultation') {
                    session.title = query.length > 34 ? query.slice(0, 34) + '...' : query;
                }

                await session.save();
                return {
                    response: aiReply,
                    sessionId: session._id,
                    sessionTitle: session.title,
                    messages: session.messages,
                };
            } catch (err) {
                console.error('Failed to save AI session message:', err);
            }
        }

        return { response: aiReply };
    }

    async generatePlan(userData: any) {
        try {
            const aiRequest = {
                user_id: userData.userId || userData.user_id || 'user',
                goal: Array.isArray(userData.goals) ? userData.goals[0] : (userData.goals || userData.goal || 'Hypertrophy'),
                fitness_level: (userData.fitnessLevel || userData.fitness_level || 'beginner').toLowerCase(),
                split_type: userData.splitType || userData.split_type || 'UpperLower',
                cycle_weeks: userData.cycleWeeks || userData.cycle_weeks || 4,
                equipment: userData.equipment || userData.availableEquipment || [],
                injuries: userData.injuries || [],
            };
            const { data } = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/generator/master-plan`, aiRequest).pipe(
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
            if (error instanceof HttpException &&
                (error.getStatus() === HttpStatus.SERVICE_UNAVAILABLE ||
                    error.getStatus() === HttpStatus.INTERNAL_SERVER_ERROR)) {
                return {
                    title: 'Personalized Fitness Plan',
                    userData,
                    plan: {
                        workouts: ['Full Body HIIT', 'Strength Training', 'Cardio'],
                        nutrition: ['High protein diet', 'Stay hydrated'],
                    },
                    note: 'AI service temporarily unavailable - showing default plan',
                };
            }
            throw error;
        }
    }

    async calculateProgressiveOverload(data: any) {
        try {
            const { data: result } = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/algorithms/overload`, data).pipe(
                    catchError((error: AxiosError) => {
                        throw new HttpException(
                            error.response?.data || 'AI Service Error',
                            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                        );
                    }),
                ),
            );
            return result;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException('Failed to calculate progressive overload', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async calculateAdaptiveTdee(data: any) {
        try {
            const { data: result } = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/algorithms/tdee`, data).pipe(
                    catchError((error: AxiosError) => {
                        throw new HttpException(
                            error.response?.data || 'AI Service Error',
                            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                        );
                    }),
                ),
            );
            return result;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException('Failed to calculate adaptive TDEE', HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
            // Transform to AI service format
            const aiRequest = {
                user_id: 'user',
                goal: preferences.diet || 'maintain',
                dietary_restrictions: preferences.allergies || [],
                calories_target: preferences.targetCalories || 2000,
                meals_per_day: preferences.mealsPerDay || 3,
            };
            const { data } = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/rag/meal-plan`, aiRequest).pipe(
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
            // Transform to AI service format
            const aiRequest = {
                user_id: 'user',
                fitness_level: preferences.fitnessLevel?.toLowerCase() || 'beginner',
                goal: preferences.goals?.[0] || 'strength',
                available_equipment: preferences.equipment || [],
                duration_minutes: preferences.duration || 45,
                days_per_week: 3,
            };
            const { data } = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/rag/workout-plan`, aiRequest).pipe(
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
