import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { CoachProfileService } from './modules/coach-profile/coach-profile.service';
import { WorkoutsService } from './modules/workouts/workouts.service';
import { NutritionService } from './modules/nutrition/nutrition.service';
import { PlansService } from './modules/plans/plans.service';
import { ProductsService } from './modules/products/products.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const usersService = app.get(UsersService);
    const coachProfileService = app.get(CoachProfileService);
    const workoutsService = app.get(WorkoutsService);
    const nutritionService = app.get(NutritionService);
    const plansService = app.get(PlansService);
    const productsService = app.get(ProductsService);

    // Get direct MongoDB connection for bulk operations
    const connection = app.get<Connection>('DatabaseConnection');
    const orderCollection = connection.collection('orders');
    const userCollection = connection.collection('users');

    console.log('🌱 Starting Seeding...');

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash('password123', salt);

    // ── 1. Create core users ──
    let admin = await usersService.findByEmail('admin@example.com');
    if (!admin) {
        admin = await usersService.create({
            email: 'admin@example.com',
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            role: 'Admin',
            isVerified: true,
        } as any);
        console.log('✅ Admin created');
    } else {
        console.log('⏩ Admin exists');
    }

    let coach = await usersService.findByEmail('coach@example.com');
    if (!coach) {
        coach = await usersService.create({
            email: 'coach@example.com',
            passwordHash,
            firstName: 'Coach',
            lastName: 'Mike',
            role: 'Coach',
            isVerified: true,
        } as any);
        console.log('✅ Coach created');
    } else {
        console.log('⏩ Coach exists');
    }

    let customer = await usersService.findByEmail('user@example.com');
    if (!customer) {
        customer = await usersService.create({
            email: 'user@example.com',
            passwordHash,
            firstName: 'John',
            lastName: 'Doe',
            role: 'Customer',
            isVerified: true,
        } as any);
        console.log('✅ Customer created');
    } else {
        console.log('⏩ Customer exists');
    }

    // ── 2. Seed additional users spread over 60 days ──
    const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'James', 'Sophia', 'Lucas', 'Mia', 'Ethan',
        'Isabella', 'Mason', 'Charlotte', 'Logan', 'Amelia', 'Benjamin', 'Harper', 'Elijah', 'Evelyn', 'William',
        'Luna', 'Henry', 'Ella', 'Sebastian', 'Chloe', 'Jack', 'Scarlett', 'Aiden', 'Penelope', 'Owen',
        'Layla', 'Samuel', 'Riley', 'Ryan', 'Zoey', 'Nathan', 'Nora', 'Caleb', 'Lily', 'Daniel',
        'Eleanor', 'Matthew', 'Hannah', 'Leo', 'Lillian', 'David', 'Addison', 'Joseph', 'Aubrey', 'Carter'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

    const now = new Date();
    let seededUserCount = 0;
    const allUserIds: string[] = [customer._id.toString()];

    for (let i = 0; i < 50; i++) {
        const email = `user${i + 1}@fitglow.com`;
        const existing = await usersService.findByEmail(email);
        if (!existing) {
            const daysAgo = Math.floor(Math.random() * 60);
            const createdAt = new Date(now);
            createdAt.setDate(createdAt.getDate() - daysAgo);
            createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            const isSubscribed = Math.random() > 0.6;
            const user = await usersService.create({
                email,
                passwordHash,
                firstName: firstNames[i % firstNames.length],
                lastName: lastNames[i % lastNames.length],
                role: 'Customer',
                isVerified: true,
                subscriptionStatus: isSubscribed ? 'active' : 'none',
            } as any);

            // Backdate createdAt directly in MongoDB
            await userCollection.updateOne(
                { _id: user._id },
                { $set: { createdAt, updatedAt: createdAt } },
            );

            allUserIds.push(user._id.toString());
            seededUserCount++;
        } else {
            allUserIds.push(existing._id.toString());
        }
    }
    console.log(`✅ ${seededUserCount} additional users seeded (50 total customers)`);

    // ── 3. Seed additional coaches ──
    const coachNames = [
        { first: 'Sarah', last: 'Fitness', bio: 'HIIT and CrossFit specialist', specialties: ['CrossFit', 'HIIT', 'Weight Loss'] },
        { first: 'David', last: 'Strong', bio: 'Bodybuilding and powerlifting coach', specialties: ['Bodybuilding', 'Powerlifting'] },
        { first: 'Lisa', last: 'Zen', bio: 'Yoga and mindfulness instructor', specialties: ['Yoga', 'Meditation', 'Flexibility'] },
    ];

    for (const cn of coachNames) {
        const email = `${cn.first.toLowerCase()}@fitglow.com`;
        let c = await usersService.findByEmail(email);
        if (!c) {
            c = await usersService.create({
                email,
                passwordHash,
                firstName: cn.first,
                lastName: cn.last,
                role: 'Coach',
                isVerified: true,
            } as any);
            console.log(`✅ Coach ${cn.first} created`);
        }
        const existingProfile = await coachProfileService.findByUserId(c._id.toString());
        if (!existingProfile) {
            await coachProfileService.create(c._id.toString(), {
                bio: cn.bio,
                specialties: cn.specialties,
                experienceYears: 3 + Math.floor(Math.random() * 12),
                certifications: ['NASM', 'ACE'].slice(0, 1 + Math.floor(Math.random() * 2)),
                socialLinks: {},
            });
            console.log(`✅ Coach Profile for ${cn.first} created`);
        }
    }

    // Original coach profile
    if (coach) {
        const existingProfile = await coachProfileService.findByUserId(coach._id.toString());
        if (!existingProfile) {
            await coachProfileService.create(coach._id.toString(), {
                bio: 'Certified Personal Trainer with 10 years of experience.',
                specialties: ['Weight Loss', 'Strength Training', 'HIIT'],
                experienceYears: 10,
                certifications: ['NASM', 'ACE'],
                socialLinks: { instagram: 'coachmike', twitter: 'coachmike' },
            });
            console.log('✅ Coach Profile for Mike created');
        }
    }

    // ── 4. Seed Products ──
    const products = [
        { name: 'Whey Protein Powder', description: 'Premium whey protein isolate, 25g per serving.', price: 49.99, category: 'supplements', stock: 120, sku: 'SUP-001' },
        { name: 'Creatine Monohydrate', description: 'Micronized creatine for strength and recovery.', price: 29.99, salePrice: 24.99, category: 'supplements', stock: 200, sku: 'SUP-002' },
        { name: 'Resistance Bands Set', description: 'Set of 5 resistance bands with varying tension.', price: 34.99, category: 'equipment', stock: 85, sku: 'EQP-001' },
        { name: 'Adjustable Dumbbells', description: 'Adjustable dumbbells 5-52.5 lbs per hand.', price: 299.99, salePrice: 249.99, category: 'equipment', stock: 30, sku: 'EQP-002' },
        { name: 'Yoga Mat Premium', description: 'Extra thick non-slip yoga mat.', price: 39.99, category: 'equipment', stock: 150, sku: 'EQP-003' },
        { name: 'Performance T-Shirt', description: 'Moisture-wicking workout t-shirt.', price: 29.99, category: 'apparel', stock: 300, sku: 'APP-001' },
        { name: 'Compression Leggings', description: 'High-waist compression leggings.', price: 44.99, category: 'apparel', stock: 180, sku: 'APP-002' },
        { name: 'Shaker Bottle', description: 'BPA-free protein shaker bottle 28oz.', price: 12.99, category: 'accessories', stock: 500, sku: 'ACC-001' },
        { name: 'Lifting Gloves', description: 'Padded weight lifting gloves.', price: 19.99, category: 'accessories', stock: 200, sku: 'ACC-002' },
        { name: 'Pre-Workout Energy', description: 'High caffeine pre-workout formula.', price: 39.99, salePrice: 34.99, category: 'supplements', stock: 95, sku: 'SUP-003' },
    ];

    const productIds: string[] = [];
    for (const p of products) {
        // Check by name since ProductsService doesn't have findByTitle
        const existing = await productsService.findAll({ search: p.name });
        if (!existing || existing.length === 0) {
            const created = await productsService.create(p as any);
            productIds.push((created as any)._id.toString());
            console.log(`✅ Product "${p.name}" created`);
        } else {
            productIds.push((existing[0] as any)._id.toString());
            console.log(`⏩ Product "${p.name}" exists`);
        }
    }

    // ── 5. Seed Orders spread over 60 days ──
    const existingOrders = await orderCollection.countDocuments();
    if (existingOrders < 5) {
        const statuses = ['pending', 'processing', 'shipped', 'delivered', 'delivered', 'delivered'];
        let orderCount = 0;

        for (let i = 0; i < 80; i++) {
            const daysAgo = Math.floor(Math.random() * 60);
            const orderDate = new Date(now);
            orderDate.setDate(orderDate.getDate() - daysAgo);
            orderDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            const numItems = 1 + Math.floor(Math.random() * 3);
            const items: { productId: string; quantity: number; price: number; name: string; image: string }[] = [];
            let totalAmount = 0;

            for (let j = 0; j < numItems; j++) {
                const prodIdx = Math.floor(Math.random() * products.length);
                const qty = 1 + Math.floor(Math.random() * 3);
                const price = products[prodIdx].salePrice || products[prodIdx].price;
                totalAmount += price * qty;
                items.push({
                    productId: productIds[prodIdx],
                    quantity: qty,
                    price,
                    name: products[prodIdx].name,
                    image: '',
                });
            }

            totalAmount = Math.round(totalAmount * 100) / 100;
            const userId = allUserIds[Math.floor(Math.random() * allUserIds.length)];

            await orderCollection.insertOne({
                userId,
                items,
                totalAmount,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                shippingAddress: {
                    name: 'Test User',
                    street: `${100 + i} Main St`,
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    country: 'US',
                    phone: '555-0100',
                },
                createdAt: orderDate,
                updatedAt: orderDate,
            });
            orderCount++;
        }
        console.log(`✅ ${orderCount} orders seeded over 60 days`);
    } else {
        console.log(`⏩ Orders already exist (${existingOrders}), skipping`);
    }

    // ── 6. Seed Workouts ──
    const workouts = [
        { title: 'Full Body HIIT', description: '## Instructions\nHigh intensity interval training for full body.\n\n## Tips\nStay hydrated and take breaks when needed.', videoUrl: '', difficulty: 'Intermediate', tags: ['HIIT', 'Cardio', 'Full Body'], duration: 30, calories: 300 },
        { title: 'Yoga for Beginners', description: '## Instructions\nRelaxing yoga flow for flexibility.\n\n## Tips\nFocus on breathing.', videoUrl: '', difficulty: 'Beginner', tags: ['Yoga', 'Flexibility'], duration: 45, calories: 150 },
        { title: 'Advanced Strength', description: '## Instructions\nHeavy compound lifts for muscle gain.\n\n## Tips\nWarm up properly before heavy sets.', videoUrl: '', difficulty: 'Advanced', tags: ['Strength', 'Muscle'], duration: 60, calories: 400 },
        { title: 'Core Blaster', description: '## Instructions\n10 min intense ab workout.\n\n## Tips\nKeep core engaged throughout.', videoUrl: '', difficulty: 'Intermediate', tags: ['Core', 'Abs'], duration: 10, calories: 100 },
        { title: 'Cardio Kickboxing', description: '## Instructions\nHigh energy kickboxing cardio.\n\n## Tips\nKeep your guard up.', videoUrl: '', difficulty: 'Intermediate', tags: ['Cardio', 'Kickboxing'], duration: 40, calories: 350 },
    ];

    for (const w of workouts) {
        const existing = await workoutsService.findByTitle(w.title);
        if (!existing) {
            await workoutsService.create(w);
            console.log(`✅ Workout "${w.title}" created`);
        }
    }

    // ── 7. Seed Nutrition / Meals ──
    const meals = [
        { title: 'High Protein Breakfast', content: '## Ingredients\n3 eggs, 2 toast, 1 avocado\n\n## Instructions\nScramble eggs, toast bread, slice avocado.', imageUrl: '', tags: ['Breakfast', 'High Protein'], calories: 450, protein: 35, carbs: 30, fats: 20 },
        { title: 'Keto Lunch Salad', content: '## Ingredients\nChicken breast, spinach, olive oil, feta\n\n## Instructions\nGrill chicken, toss with greens and dressing.', imageUrl: '', tags: ['Lunch', 'Keto', 'Low Carb'], calories: 500, protein: 40, carbs: 8, fats: 32 },
        { title: 'Post-Workout Smoothie', content: '## Ingredients\n1 banana, 1 scoop whey, milk, peanut butter\n\n## Instructions\nBlend all ingredients until smooth.', imageUrl: '', tags: ['Snack', 'Post-Workout'], calories: 380, protein: 30, carbs: 45, fats: 10 },
        { title: 'Grilled Salmon Bowl', content: '## Ingredients\nSalmon fillet, brown rice, broccoli, soy sauce\n\n## Instructions\nGrill salmon, cook rice, steam broccoli.', imageUrl: '', tags: ['Dinner', 'High Protein', 'Omega-3'], calories: 620, protein: 45, carbs: 50, fats: 22 },
    ];

    for (const n of meals) {
        const existing = await nutritionService.findByTitle(n.title);
        if (!existing) {
            await nutritionService.create(n);
            console.log(`✅ Meal "${n.title}" created`);
        }
    }

    // ── 8. Seed Plan ──
    if (coach && customer) {
        const existingPlan = await plansService.findByCoachAndCustomer(
            coach._id.toString(),
            customer._id.toString(),
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
                isActive: true,
            });
            console.log('✅ Plan created');
        }
    }

    console.log('\n🚀 Seeding Complete!');
    console.log(`   Users: 50+ customers, 4 coaches, 1 admin`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Orders: 80 (spread over 60 days)`);
    console.log(`   Workouts: ${workouts.length}`);
    console.log(`   Meals: ${meals.length}`);

    await app.close();
}

bootstrap();
