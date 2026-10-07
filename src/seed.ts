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
    const productCollection = connection.collection('products');

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
        {
            name: 'ISO-Pure Whey Isolate',
            sku: 'SUP-001',
            description: '100% Cross-flow microfiltered cold-processed whey isolate. 27g protein per scoop with zero added sugars.',
            price: 64.99,
            salePrice: 54.99,
            category: 'supplements',
            stock: 120,
            averageRating: 4.9,
            reviewCount: 142,
            images: ['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800'],
            flavors: ['Double Rich Chocolate', 'Madagascar Vanilla', 'Salted Caramel Crunch'],
            specifications: { Servings: '30', Protein: '27g', BCAAs: '6.2g' },
        },
        {
            name: 'NeuroDrive Pre-Workout Igniter',
            sku: 'SUP-003',
            description: 'Clinical dose citrulline, beta-alanine, and alpha-GPC for laser tunnel focus, vascularity, and boundless power.',
            price: 49.99,
            salePrice: 42.99,
            category: 'supplements',
            stock: 95,
            averageRating: 4.8,
            reviewCount: 98,
            images: ['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800'],
            flavors: ['Electric Lime Rush', 'Blue Raspberry Blast', 'Watermelon Surge'],
            specifications: { Servings: '40', Caffeine: '300mg', Citrulline: '8000mg' },
        },
        {
            name: 'Heavy Duty 10mm Lever Lifting Belt',
            sku: 'EQP-001',
            description: 'Competition grade top-grain leather with hardened alloy matte black quick-release lever mechanism.',
            price: 119.99,
            salePrice: 99.99,
            category: 'equipment',
            stock: 42,
            averageRating: 5.0,
            reviewCount: 76,
            images: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800'],
            sizes: ['Small (28-32")', 'Medium (32-36")', 'Large (36-40")', 'XL (40-44")'],
            specifications: { Thickness: '10mm', Material: 'Vegetable-tanned Leather' },
        },
        {
            name: 'Seamless Compression Tech Tee',
            sku: 'APP-001',
            description: 'Ultra-breathable 4-way stretch fabric engineered to keep you cool, dry, and mobile during heavy reps.',
            price: 38.00,
            salePrice: 32.00,
            category: 'apparel',
            stock: 64,
            averageRating: 4.7,
            reviewCount: 51,
            images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800'],
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            specifications: { Fit: 'Athletic Tapered', Fabric: 'Polyester / Elastane' },
        },
        {
            name: 'SmartCoach Insulated Steel Shaker (800ml)',
            sku: 'ACC-001',
            description: 'Double-wall vacuum insulated stainless steel shaker with built-in silent agitator and leak-proof spout.',
            price: 28.00,
            salePrice: 22.50,
            category: 'accessories',
            stock: 150,
            averageRating: 4.9,
            reviewCount: 88,
            images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'],
            specifications: { Capacity: '800ml', Material: '18/8 Food Grade Steel' },
        },
        {
            name: 'Heavy Resistance Band Set (5-Pack)',
            sku: 'EQP-002',
            description: '100% Malaysian latex loop bands ranging from 15 lbs to 150 lbs of tension for warming up and resistance work.',
            price: 34.99,
            salePrice: 29.99,
            category: 'equipment',
            stock: 85,
            averageRating: 4.8,
            reviewCount: 64,
            images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&q=80&w=800'],
            specifications: { Resistance: '15 - 150 lbs', Material: '100% Malaysian Latex' },
        },
        {
            name: 'Creatine Monohydrate Micronized',
            sku: 'SUP-002',
            description: 'Micronized creatine monohydrate for explosive power, ATP replenishment, and cellular hydration.',
            price: 29.99,
            salePrice: 24.99,
            category: 'supplements',
            stock: 200,
            averageRating: 4.9,
            reviewCount: 115,
            images: ['https://images.unsplash.com/photo-1616803689943-5601631c7fec?auto=format&fit=crop&q=80&w=800'],
            specifications: { Servings: '100', Dose: '5g Pure Creapure' },
        },
        {
            name: 'Adjustable Quick-Lock Dumbbells (50 lbs)',
            sku: 'EQP-003',
            description: 'Commercial-grade fast selector adjustable dumbbell system replacing 10 pairs of traditional dumbbells.',
            price: 299.99,
            salePrice: 249.99,
            category: 'equipment',
            stock: 30,
            averageRating: 4.9,
            reviewCount: 42,
            images: ['https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&q=80&w=800'],
            specifications: { Range: '5 - 50 lbs per hand', Increment: '2.5 / 5 lbs' },
        },
    ];

    const productIds: string[] = [];
    for (const p of products) {
        const existing = await productCollection.findOne({ $or: [{ sku: p.sku }, { name: p.name }] });
        if (!existing) {
            const created = await productsService.create(p as any);
            productIds.push((created as any)._id.toString());
            console.log(`✅ Product "${p.name}" created`);
        } else {
            await productCollection.updateOne(
                { _id: existing._id },
                { $set: p }
            );
            productIds.push(existing._id.toString());
            console.log(`✅ Product "${p.name}" updated`);
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
        {
            title: 'Upper Body Hypertrophy Blitz',
            description: 'High-density hypertrophy session hitting chest, delts, and lats with mechanical tension and controlled eccentrics.',
            difficulty: 'Intermediate',
            category: 'Hypertrophy',
            duration: 52,
            calories: 460,
            tags: ['Chest', 'Back', 'Shoulders', 'Hypertrophy'],
            targetMuscles: ['Chest', 'Lats', 'Lateral Deltoids', 'Triceps'],
            thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            exercises: [
                {
                    id: 'e_01',
                    name: 'Incline Dumbbell Bench Press',
                    sets: 4,
                    reps: 10,
                    weight: 32,
                    restSeconds: 90,
                    targetMuscle: 'Upper Chest',
                    instructions: ['Set bench to 30 degrees', 'Retract scapulae and lower under control (3s negative)', 'Drive up with explosive intent'],
                },
                {
                    id: 'e_02',
                    name: 'Neutral Grip Chest-Supported Row',
                    sets: 4,
                    reps: 12,
                    weight: 40,
                    restSeconds: 75,
                    targetMuscle: 'Lats & Rhomboids',
                    instructions: ['Lock sternum firmly against pad', 'Pull elbows back past torso', 'Pause 1s at peak muscular contraction'],
                },
                {
                    id: 'e_03',
                    name: 'Standing Cable Lateral Raises',
                    sets: 4,
                    reps: 15,
                    weight: 12,
                    restSeconds: 60,
                    targetMuscle: 'Lateral Deltoids',
                    instructions: ['Maintain slight 15-degree elbow bend', 'Lead with elbows slightly anterior to coronal plane', 'Resist eccentric descent'],
                },
                {
                    id: 'e_04',
                    name: 'Rope Tricep Overhead Extension',
                    sets: 3,
                    reps: 12,
                    weight: 24,
                    restSeconds: 60,
                    targetMuscle: 'Triceps Long Head',
                    instructions: ['Flare rope wide at full overhead extension', 'Control stretch deep behind head to emphasize long head'],
                },
            ],
        },
        {
            title: 'Posterior Chain & Quad Annihilation',
            description: 'Heavy compound leg day emphasizing Romanian deadlifts, barbell back squats, and Bulgarian split squats.',
            difficulty: 'Advanced',
            category: 'Strength',
            duration: 60,
            calories: 580,
            tags: ['Quads', 'Hamstrings', 'Glutes', 'Strength'],
            targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            thumbnailUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&q=80&w=600',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            exercises: [
                {
                    id: 'e_11',
                    name: 'Barbell Back Squat',
                    sets: 4,
                    reps: 8,
                    weight: 110,
                    restSeconds: 120,
                    targetMuscle: 'Quads & Glutes',
                    instructions: ['Hit parallel depth or deeper', 'Brace abdominal wall with intra-abdominal pressure', 'Drive heels through platform'],
                },
                {
                    id: 'e_12',
                    name: 'Romanian Deadlift (Barbell)',
                    sets: 4,
                    reps: 10,
                    weight: 95,
                    restSeconds: 90,
                    targetMuscle: 'Hamstrings & Glutes',
                    instructions: ['Hinge strictly at hip joint', 'Maintain neutral cervical and lumbar spine', 'Feel tension stretch in posterior chain'],
                },
                {
                    id: 'e_13',
                    name: 'Bulgarian Split Squat',
                    sets: 3,
                    reps: 10,
                    weight: 22,
                    restSeconds: 75,
                    targetMuscle: 'Quads & Pelvic Stability',
                    instructions: ['Rear foot elevated on bench', 'Slight forward torso lean to load hip extensors'],
                },
                {
                    id: 'e_14',
                    name: 'Standing Calf Raises',
                    sets: 4,
                    reps: 15,
                    weight: 60,
                    restSeconds: 60,
                    targetMuscle: 'Gastrocnemius & Soleus',
                    instructions: ['2-second loaded stretch at deficit', 'Explosive plantarflexion to peak contraction'],
                },
            ],
        },
        {
            title: 'Full Body HIIT & Metabolic Conditioning',
            description: 'High intensity interval training designed to maximize VO2 max, EPOC metabolic expenditure, and functional stamina.',
            difficulty: 'Intermediate',
            category: 'HIIT',
            duration: 35,
            calories: 380,
            tags: ['HIIT', 'Cardio', 'Full Body', 'Metabolic'],
            targetMuscles: ['Full Body', 'Cardiovascular System'],
            thumbnailUrl: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600',
            videoUrl: 'https://assets.mixkit.co/videos/23056/23056-720.mp4',
            exercises: [
                {
                    id: 'e_21',
                    name: 'Kettlebell Swings',
                    sets: 4,
                    reps: 20,
                    weight: 24,
                    restSeconds: 45,
                    targetMuscle: 'Hamstrings & Glutes',
                    instructions: ['Explosive hip extension', 'Do not squat the swing; pure hip hinge'],
                },
                {
                    id: 'e_22',
                    name: 'Dumbbell Thrusters',
                    sets: 4,
                    reps: 12,
                    weight: 16,
                    restSeconds: 60,
                    targetMuscle: 'Quads, Shoulders & Core',
                    instructions: ['Full front squat into fluid overhead push press in one continuous movement'],
                },
                {
                    id: 'e_23',
                    name: 'Renegade Rows',
                    sets: 3,
                    reps: 10,
                    weight: 14,
                    restSeconds: 45,
                    targetMuscle: 'Upper Back & Anti-Rotation Core',
                    instructions: ['Keep hips level and minimize pelvic sway during row'],
                },
            ],
        },
        {
            title: 'Core Blaster & Anti-Rotation Protocol',
            description: 'Intense 15-minute core training routine focusing on sagittal flexion, anti-rotation, and pelvic control.',
            difficulty: 'Beginner',
            category: 'Strength',
            duration: 15,
            calories: 140,
            tags: ['Core', 'Abs', 'Stability'],
            targetMuscles: ['Rectus Abdominis', 'Obliques', 'Transverse Abdominis'],
            thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            exercises: [
                {
                    id: 'e_31',
                    name: 'Hanging Leg Raises',
                    sets: 3,
                    reps: 12,
                    weight: 0,
                    restSeconds: 60,
                    targetMuscle: 'Lower Rectus Abdominis',
                    instructions: ['Posterior pelvic tilt at peak lift', 'Control negative swing completely'],
                },
                {
                    id: 'e_32',
                    name: 'Cable Pallof Press',
                    sets: 3,
                    reps: 12,
                    weight: 15,
                    restSeconds: 45,
                    targetMuscle: 'Obliques & Anti-Rotation',
                    instructions: ['Hold extended position for 2 seconds against lateral rotational torque'],
                },
            ],
        },
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
        { title: 'High Protein Breakfast', content: '## Ingredients\n3 eggs, 2 toast, 1 avocado\n\n## Instructions\nScramble eggs, toast bread, slice avocado.', imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600', tags: ['Breakfast', 'High Protein'], calories: 450, protein: 35, carbs: 30, fats: 20 },
        { title: 'Keto Lunch Salad', content: '## Ingredients\nChicken breast, spinach, olive oil, feta\n\n## Instructions\nGrill chicken, toss with greens and dressing.', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', tags: ['Lunch', 'Keto', 'Low Carb'], calories: 500, protein: 40, carbs: 8, fats: 32 },
        { title: 'Post-Workout Smoothie', content: '## Ingredients\n1 banana, 1 scoop whey, milk, peanut butter\n\n## Instructions\nBlend all ingredients until smooth.', imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600', tags: ['Snack', 'Post-Workout'], calories: 380, protein: 30, carbs: 45, fats: 10 },
        { title: 'Grilled Salmon Bowl', content: '## Ingredients\nSalmon fillet, brown rice, broccoli, soy sauce\n\n## Instructions\nGrill salmon, cook rice, steam broccoli.', imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600', tags: ['Dinner', 'High Protein', 'Omega-3'], calories: 620, protein: 45, carbs: 50, fats: 22 },
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

    // ── 9. Update images and catalog specs for existing records ──
    const workoutCollection = connection.collection('freeworkouts');
    const nutritionCollection = connection.collection('freenutritions');

    for (const p of products) {
        await productCollection.updateOne(
            { $or: [{ sku: p.sku }, { name: p.name }] },
            { $set: p },
        );
    }
    console.log('✅ Products updated with full catalog specs');

    for (const w of workouts) {
        await workoutCollection.updateOne(
            { title: w.title },
            { $set: { thumbnailUrl: (w as any).thumbnailUrl, videoUrl: w.videoUrl, exercises: (w as any).exercises, targetMuscles: (w as any).targetMuscles, category: w.category, duration: w.duration, calories: w.calories, tags: w.tags } },
        );
    }
    console.log('✅ Workout thumbnails, videos & exercises updated');

    for (const n of meals) {
        await nutritionCollection.updateOne(
            { title: n.title },
            { $set: { imageUrl: n.imageUrl } },
        );
    }
    console.log('✅ Meal images updated');

    console.log('\n🚀 Seeding Complete!');
    console.log(`   Users: 50+ customers, 4 coaches, 1 admin`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Orders: 80 (spread over 60 days)`);
    console.log(`   Workouts: ${workouts.length}`);
    console.log(`   Meals: ${meals.length}`);

    await app.close();
}

bootstrap();
