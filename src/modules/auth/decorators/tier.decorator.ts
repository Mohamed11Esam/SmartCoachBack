import { SetMetadata } from '@nestjs/common';

export const TIERS_KEY = 'subscription_tiers';
export const RequireTier = (...tiers: ('free' | 'pro' | 'elite')[]) => SetMetadata(TIERS_KEY, tiers);
