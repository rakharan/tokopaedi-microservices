import "reflect-metadata";
import fastify from 'fastify';
import { connectDatabase, AppDataSource } from './infrastructure/mysql';
import { UserService } from './services/UserService';
import { AuthController } from './controllers/AuthController';
import { User } from './models/User';
import dotenv from 'dotenv';
import path from "path";
import { EventPublisher } from "@tokopaedi/shared";

dotenv.config({ path: path.resolve(__dirname, `../.env`) });

const app = fastify({ logger: true });

async function bootstrap() {
    try {
        // 1. Connect to Database
        await connectDatabase();

        // 2. Connect to RabbitMQ (New Granular Config)
        const eventPublisher = new EventPublisher();

        // 3. Initialize Services
        const userRepository = AppDataSource.getRepository(User);

        const userService = new UserService(
            userRepository,
            eventPublisher,
            process.env.JWT_SECRET || 'secret'
        );
        const authController = new AuthController(userService);

        // 4. Register Routes
        await app.register(async (api) => {
            api.post('/auth/register', authController.register.bind(authController));
            api.post('/auth/login', authController.login.bind(authController));
            api.get('/auth/verify/:token', authController.verifyEmail.bind(authController));
        }, { prefix: '/v1/users' });

        app.get('/health', async () => ({ status: 'ok', service: 'user-service' }));

        // 5. Start Server
        const PORT = parseInt(process.env.PORT || '3001');
        await app.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`User Service running on port ${PORT}`);
    } catch (error) {
        console.error('Failed to start service:', error);
        process.exit(1);
    }
}

bootstrap();