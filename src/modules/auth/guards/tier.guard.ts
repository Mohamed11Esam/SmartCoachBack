import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TIERS_KEY } from '../decorators/tier.decorator';
import { UsersService } from '../../users/users.service';

@Injectable()
export class SubscriptionTierGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private usersService: UsersService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredTiers = this.reflector.getAllAndOverride<string[]>(TIERS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredTiers || requiredTiers.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return false;
        }

        // Admins and Coaches bypass tier restrictions
        if (user.role === 'Admin' || user.role === 'Coach') {
            return true;
        }

        const fullUser = await this.usersService.findById(user.userId || user.sub);
        if (!fullUser) {
            return false;
        }

        const currentTier = (fullUser as any).subscriptionTier || 'free';
        const status = fullUser.subscriptionStatus;

        // If subscription is not active (except if required tier includes 'free'), deny
        if (status !== 'active' && !requiredTiers.includes('free')) {
            throw new ForbiddenException(`This feature requires an active ${requiredTiers.join(' or ')} subscription`);
        }

        const tierWeight: Record<string, number> = {
            free: 1,
            pro: 2,
            elite: 3,
        };

        const userWeight = tierWeight[currentTier] || 1;
        const hasRequiredTier = requiredTiers.some(
            (tier) => userWeight >= (tierWeight[tier] || 1),
        );

        if (!hasRequiredTier) {
            throw new ForbiddenException(
                `Upgrade required: This feature is only available on ${requiredTiers.join('/')} tiers`,
            );
        }

        return true;
    }
}
