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
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ role: 1 });
UserSchema.index({ isBanned: 1 });
UserSchema.index({ subscriptionStatus: 1 });
