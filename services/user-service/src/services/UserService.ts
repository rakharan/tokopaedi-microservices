import { Repository } from 'typeorm';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken'; // 1. Add SignOptions
import { EventPublisher } from '../infrastructure/EventPublisher';
import { UserCreatedEvent, UserVerifiedEvent } from '@tokopaedi/shared';

export class UserService {
    constructor(
        private userRepository: Repository<User>,
        private eventPublisher: EventPublisher,
        private jwtSecret: string
    ) { }

    async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        const aDayInSeconds = 24 * 3600

        const hashedPassword = await bcrypt.hash(password, 10);
        const emailToken = this.generateToken({ email }, aDayInSeconds);

        const user = this.userRepository.create({
            name,
            email,
            password: hashedPassword,
            emailToken,
            level: 3,
            isVerified: false,
            createdAt: Math.floor(Date.now() / 1000),
        });

        await this.userRepository.save(user);

        const event: UserCreatedEvent = {
            eventType: 'user.created',
            timestamp: Date.now(),
            data: {
                userId: user.id,
                email: user.email,
                name: user.name,
                level: user.level,
            },
        };
        await this.eventPublisher.publish(event);

        const aWeekInSeconds = 24 * 7 * 3600

        const token = this.generateToken({ userId: user.id, email: user.email }, aWeekInSeconds);

        return { user, token };
    }

    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        const user = await this.userRepository.findOne({ where: { email, isDeleted: false } });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        const aWeekInSeconds = 24 * 7 * 3600

        const token = this.generateToken({ userId: user.id, email: user.email }, aWeekInSeconds);

        return { user, token };
    }

    async verifyEmail(token: string): Promise<User> {
        const decoded = jwt.verify(token, this.jwtSecret) as { email: string };

        const user = await this.userRepository.findOne({
            where: { email: decoded.email, emailToken: token }
        });

        if (!user) {
            throw new Error('Invalid verification token');
        }

        user.isVerified = true;
        user.emailToken = null;
        await this.userRepository.save(user);

        const event: UserVerifiedEvent = {
            eventType: 'user.verified',
            timestamp: Date.now(),
            data: {
                userId: user.id,
                email: user.email,
            },
        };
        await this.eventPublisher.publish(event);

        return user;
    }

    private generateToken(payload: object, expiresIn: number): string {
        const options: SignOptions = { expiresIn };
        return jwt.sign(payload, this.jwtSecret, options);
    }
}