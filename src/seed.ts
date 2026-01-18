import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { CoachProfileService } from './modules/coach-profile/coach-profile.service';
import { WorkoutsService } from './modules/workouts/workouts.service';
import { NutritionService } from './modules/nutrition/nutrition.service';
import { PlansService } from './modules/plans/plans.service';
import { ChatService } from './modules/chat/chat.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const usersService = app.get(UsersService);
    const coachProfileService = app.get(CoachProfileService);
    const workoutsService = app.get(WorkoutsService);
    const nutritionService = app.get(NutritionService);
    const plansService = app.get(PlansService);
    const chatService = app.get(ChatService);

    console.log('🌱 Starting Seeding...');

    // 1. Create Users
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash('password123', salt);

    // Admin
    let admin = await usersService.findByEmail('admin@example.com');
    if (!admin) {
        admin = await usersService.create({
            email: 'admin@example.com',
            passwordHash,
            fullName: 'Admin User',
            role: 'Admin',
            isVerified: true
        } as any);
        console.log('✅ Admin created');
    }

    // Coach
    let coach = await usersService.findByEmail('coach@example.com');
    if (!coach) {
        coach = await usersService.create({
            email: 'coach@example.com',
            passwordHash,
            fullName: 'Coach Mike',
            role: 'Coach',
            isVerified: true
        } as any);
        console.log('✅ Coach created');
    }

    // Customer
    let customer = await usersService.findByEmail('user@example.com');
    if (!customer) {
        customer = await usersService.create({
            email: 'user@example.com',
            passwordHash,
            fullName: 'John Doe',
            role: 'Customer',
            isVerified: true
        } as any);
        console.log('✅ Customer created');
    }

    // 2. Create Coach Profile
    if (coach) {
        const existingProfile = await coachProfileService.findByUserId(coach._id.toString());
        if (!existingProfile) {
            await coachProfileService.create(coach._id.toString(), {
                bio: 'Certified Personal Trainer with 10 years of experience.',
                specialties: ['Weight Loss', 'Strength Training', 'HIIT'],
                experienceYears: 10,
                certifications: ['NASM', 'ACE'],
                socialLinks: { instagram: 'coachmike', twitter: 'coachmike' }
            });
            console.log('✅ Coach Profile created');
        }
    }

    // 3. Create Workouts
    const workouts = [
        {
            title: 'Full Body HIIT',
            description: 'High intensity interval training for full body.',
            videoUrl: 'https://example.com/video1',
            difficulty: 'Intermediate',
            tags: ['HIIT', 'Cardio', 'Full Body'],
            duration: 30,
            calories: 300
        },
        {
            title: 'Yoga for Beginners',
            description: 'Relaxing yoga flow.',
            videoUrl: 'https://example.com/video2',
            difficulty: 'Beginner',
            tags: ['Yoga', 'Flexibility'],
            duration: 45,
            calories: 150
        },
        {
            title: 'Advanced Strength',
            description: 'Heavy lifting for muscle gain.',
            videoUrl: 'https://example.com/video3',
            difficulty: 'Advanced',
            tags: ['Strength', 'Muscle'],
            duration: 60,
            calories: 400
        }
    ];

    for (const w of workouts) {
        const existing = await workoutsService.findByTitle(w.title);
        if (!existing) {
            await workoutsService.create(w);
            console.log(`✅ Workout "${w.title}" created`);
        } else {
            console.log(`⏩ Workout "${w.title}" already exists, skipping`);
        }
    }

    // 4. Create Nutrition
    const nutritionItems = [
        {
            title: 'High Protein Breakfast',
            content: 'Eggs, toast, and avocado.',
            imageUrl: 'https://example.com/food1.jpg',
            tags: ['Breakfast', 'High Protein'],
            calories: 400,
            protein: 30,
            carbs: 20,
            fats: 15
        },
        {
            title: 'Keto Lunch Salad',
            content: 'Chicken, spinach, olive oil.',
            imageUrl: 'https://example.com/food2.jpg',
            tags: ['Lunch', 'Keto', 'Low Carb'],
            calories: 500,
            protein: 40,
            carbs: 5,
            fats: 30
        }
    ];

    for (const n of nutritionItems) {
        const existing = await nutritionService.findByTitle(n.title);
        if (!existing) {
            await nutritionService.create(n);
            console.log(`✅ Nutrition "${n.title}" created`);
        } else {
            console.log(`⏩ Nutrition "${n.title}" already exists, skipping`);
        }
    }

    // 5. Create Plan (Assigned to Customer by Coach)
    if (coach && customer) {
        const existingPlan = await plansService.findByCoachAndCustomer(
            coach._id.toString(),
            customer._id.toString()
        );
        if (!existingPlan) {
            await plansService.create({
                coachId: coach._id.toString(),
                customerId: customer._id.toString(),
                title: 'Weight Loss Phase 1',
                description: '4 week plan to shed fat.',
                startDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 28)),
                workouts: [],
                nutrition: [],
                isActive: true
            });
            console.log('✅ Plan created');
        } else {
            console.log('⏩ Plan already exists, skipping');
        }
    }

    console.log('🚀 Seeding Complete!');
    await app.close();
}

bootstrap();
