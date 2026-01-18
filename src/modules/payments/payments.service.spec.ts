import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let configService: ConfigService;

    const mockConfigService = {
        getOrThrow: jest.fn((key) => {
            if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
            if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_123';
            return null;
        }),
        get: jest.fn((key) => {
            if (key === 'STRIPE_SUCCESS_URL') return 'http://test.com/success';
            if (key === 'STRIPE_CANCEL_URL') return 'http://test.com/cancel';
            return null;
        }),
    };

    const mockUsersService = {
        findByStripeCustomerId: jest.fn(),
        updateSubscription: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // Add more tests here if needed, mocking Stripe instance would be required for deeper testing
});
