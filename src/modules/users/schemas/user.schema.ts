import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop({ required: true, enum: ['Customer', 'Coach', 'Admin'], default: 'Customer' })
    role: string;

    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop()
    photoUrl?: string;

    // Onboarding profile fields
    @Prop()
    dateOfBirth?: Date;

    @Prop({ enum: ['Male', 'Female', 'Other'] })
    gender?: string;

    @Prop()
    height?: number; // in cm

    @Prop()
    weight?: number; // in kg

    @Prop({ enum: ['Lose Weight', 'Gain Muscle', 'Stay Fit', 'Build Strength', 'Improve Flexibility'] })
    fitnessGoal?: string;

    @Prop({ enum: ['Beginner', 'Intermediate', 'Advanced'] })
    fitnessLevel?: string;

    @Prop({ type: [String], default: [] })
    healthConditions: string[]; // e.g., ['Back Pain', 'Knee Injury', 'Diabetes']

    @Prop({ enum: ['Home', 'Gym', 'Both'] })
    workoutLocation?: string;

    @Prop({ type: [String], default: [] })
    preferredTrainingDays: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']

    @Prop()
    preferredWorkoutDuration?: number; // in minutes

    @Prop({ type: [String], default: [] })
    dietaryPreferences: string[]; // e.g., ['Vegetarian', 'Keto', 'Halal']

    @Prop({ default: false })
    onboardingCompleted: boolean;

    // Saved/Bookmarked items
    @Prop({ type: [{ type: Types.ObjectId, ref: 'FreeWorkout' }], default: [] })
    savedWorkouts: Types.ObjectId[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'FreeNutrition' }], default: [] })
    savedMeals: Types.ObjectId[];

    @Prop()
    stripeCustomerId?: string;

    @Prop({ type: Types.ObjectId, ref: 'CoachProfile' })
    coachProfileId?: Types.ObjectId;

    @Prop({ default: false })
    isVerified: boolean;

    @Prop()
    otpSecret?: string;

    @Prop()
    otpExpiry?: Date;

    @Prop()
    refreshToken?: string;

    @Prop({ default: true })
    emailNotifications: boolean;

    @Prop({ default: true })
    pushNotifications: boolean;

    @Prop([String])
    fcmTokens: string[];

    @Prop({ default: false })
    isBanned: boolean;

    @Prop({ enum: ['active', 'canceled', 'past_due', 'none'], default: 'none' })
    subscriptionStatus: string;

    @Prop()
    subscriptionId?: string;

    @Prop({ type: Types.ObjectId, ref: 'CoachProfile' })
    subscribedCoachId?: Types.ObjectId;

    @Prop()
    lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ role: 1 });
UserSchema.index({ isBanned: 1 });
UserSchema.index({ subscriptionStatus: 1 });
