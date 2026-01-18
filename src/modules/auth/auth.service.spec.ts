import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    const mockUsersService = {
        findByEmail: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockEmailService = {
        sendOtpEmail: jest.fn().mockResolvedValue(true),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: EmailService,
                    useValue: mockEmailService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return user data if validation is successful', async () => {
            const user = {
                email: 'test@example.com',
                passwordHash: 'hashedPassword',
                toObject: jest.fn().mockReturnValue({
                    email: 'test@example.com',
                    passwordHash: 'hashedPassword',
                    _id: 'userId',
                }),
            };
            mockUsersService.findByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.validateUser('test@example.com', 'password');
            expect(result).toEqual({ email: 'test@example.com', _id: 'userId' });
        });

        it('should return null if user not found', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            const result = await service.validateUser('test@example.com', 'password');
            expect(result).toBeNull();
        });

        it('should return null if password does not match', async () => {
            const user = {
                email: 'test@example.com',
                passwordHash: 'hashedPassword',
            };
            mockUsersService.findByEmail.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await service.validateUser('test@example.com', 'wrongPassword');
            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        it('should return access token and refresh token', async () => {
            const user = { email: 'test@example.com', _id: 'userId', role: 'Customer' };
            mockJwtService.sign.mockReturnValue('token');
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefreshToken');
            mockUsersService.update.mockResolvedValue(user);

            const result = await service.login(user);
            expect(result.access_token).toEqual('token');
            expect(result.refresh_token).toBeDefined();
            expect(result.user).toEqual(user);
        });
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'password',
                firstName: 'John',
                lastName: 'Doe',
            };
            mockUsersService.findByEmail.mockResolvedValue(null);
            (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

            const createdUser = {
                ...registerDto,
                passwordHash: 'hashedPassword',
                toObject: jest.fn().mockReturnValue({
                    ...registerDto,
                    passwordHash: 'hashedPassword',
                    _id: 'userId',
                }),
            };
            mockUsersService.create.mockResolvedValue(createdUser);

            const result = await service.register(registerDto);
            expect(result).toEqual({
                email: 'test@example.com',
                password: 'password',
                firstName: 'John',
                lastName: 'Doe',
                _id: 'userId',
            });
        });

        it('should throw ConflictException if user already exists', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'password',
                firstName: 'John',
                lastName: 'Doe',
            };
            mockUsersService.findByEmail.mockResolvedValue({ email: 'test@example.com' });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });
});
