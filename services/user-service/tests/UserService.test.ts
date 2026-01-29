import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../src/services/UserService';
import { EventPublisher } from '../src/infrastructure/EventPublisher';
import { Repository } from 'typeorm';
import { mock, MockProxy } from 'vitest-mock-extended';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/User';

// Mock external modules
vi.mock('bcrypt');
vi.mock('jsonwebtoken');

describe('UserService', () => {
    // Dependencies to mock
    let userService: UserService;
    let userRepository: MockProxy<Repository<User>>;
    let eventPublisher: MockProxy<EventPublisher>;
    const jwtSecret = 'test-secret';

    beforeEach(() => {
        // Reset mocks before each test
        userRepository = mock<Repository<User>>();
        eventPublisher = mock<EventPublisher>();

        // Create instance with mocks
        userService = new UserService(userRepository, eventPublisher, jwtSecret);

        // Reset implementations
        vi.resetAllMocks();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            // Arrange
            const input = { name: 'Test', email: 'test@example.com', password: 'password123' };
            const hashedPassword = 'hashed_password';
            const savedUser = { id: 1, ...input, password: hashedPassword, level: 3 } as User;

            userRepository.findOne.mockResolvedValue(null); // No existing user
            userRepository.create.mockReturnValue(savedUser);
            userRepository.save.mockResolvedValue(savedUser);

            // Mock bcrypt and jwt
            vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);
            vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

            // Act
            const result = await userService.register(input.name, input.email, input.password);

            // Assert
            expect(result.user).toEqual(savedUser);
            expect(result.token).toBe('mock-token');

            // Verify repository was called
            expect(userRepository.save).toHaveBeenCalledTimes(1);

            // Verify event was published
            expect(eventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
                eventType: 'user.created',
                data: expect.objectContaining({ email: input.email })
            }));
        });

        it('should throw error if email already exists', async () => {
            // Arrange
            const input = { name: 'Test', email: 'exists@example.com', password: 'password123' };
            userRepository.findOne.mockResolvedValue({ id: 1 } as User); // User exists

            // Act & Assert
            await expect(userService.register(input.name, input.email, input.password))
                .rejects
                .toThrow('Email already registered');

            expect(userRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return user profile without sensitive data', async () => {
            // Arrange
            const userId = 1;
            const fullUser = {
                id: userId,
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashed_secret', // Should be removed
                emailToken: 'secret_token', // Should be removed
                level: 3,
                isVerified: true,
                createdAt: 1234567890,
                isDeleted: false
            } as User;

            userRepository.findOne.mockResolvedValue(fullUser);

            // Act
            const result = await userService.findById(userId);

            // Assert
            expect(result.id).toBe(userId);
            expect(result.email).toBe(fullUser.email);
            // @ts-ignore - Check that sensitive fields are undefined
            expect(result.password).toBeUndefined();
            // @ts-ignore
            expect(result.emailToken).toBeUndefined();
        });

        it('should throw error if user not found', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(userService.findById(999))
                .rejects
                .toThrow('User not found');
        });
    });
});