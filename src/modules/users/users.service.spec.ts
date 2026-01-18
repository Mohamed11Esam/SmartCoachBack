import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
    let service: UsersService;
    let repository: UsersRepository;

    const mockUsersRepository = {
        findByEmail: jest.fn(),
        create: jest.fn(),
        findOneById: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: UsersRepository,
                    useValue: mockUsersRepository,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get<UsersRepository>(UsersRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findByEmail', () => {
        it('should return a user if found', async () => {
            const user = { email: 'test@example.com' };
            mockUsersRepository.findByEmail.mockResolvedValue(user);

            const result = await service.findByEmail('test@example.com');
            expect(result).toEqual(user);
        });

        it('should return null if not found', async () => {
            mockUsersRepository.findByEmail.mockResolvedValue(null);

            const result = await service.findByEmail('test@example.com');
            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new user', async () => {
            const createUserDto: CreateUserDto = {
                email: 'test@example.com',
                passwordHash: 'hashedPassword',
                firstName: 'John',
                lastName: 'Doe',
            };
            const createdUser = { ...createUserDto, _id: 'userId' };
            mockUsersRepository.create.mockResolvedValue(createdUser);

            const result = await service.create(createUserDto);
            expect(result).toEqual(createdUser);
        });
    });

    describe('findById', () => {
        it('should return a user if found', async () => {
            const user = { _id: 'userId' };
            mockUsersRepository.findOneById.mockResolvedValue(user);

            const result = await service.findById('userId');
            expect(result).toEqual(user);
        });
    });
});
