import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CoachProfileDocument = CoachProfile & Document;

@Schema({ timestamps: true })
export class CoachProfile {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop()
    bio: string;

    @Prop([String])
    specialties: string[];

    @Prop()
    experienceYears: number;

    @Prop([String])
    certifications: string[];

    @Prop({ type: Object })
    socialLinks: Record<string, string>;

    @Prop({ default: 0 })
    averageRating: number;

    @Prop({ default: 0 })
    totalReviews: number;

    @Prop({ default: false, index: true })
    isVerified: boolean;

    @Prop({ default: true })
    isActive: boolean;

    @Prop([String])
    specializations: string[]; // Alias for specialties used in admin
}

export const CoachProfileSchema = SchemaFactory.createForClass(CoachProfile);
CoachProfileSchema.index({ specialties: 1 });
