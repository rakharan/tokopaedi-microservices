import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/UserService';

interface RegisterBody {
    name: string;
    email: string;
    password: string;
}

interface LoginBody {
    email: string;
    password: string;
}

export class AuthController {
    constructor(private userService: UserService) { }

    async register(request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) {
        try {
            const { name, email, password } = request.body;
            const result = await this.userService.register(name, email, password);

            return reply.status(201).send({
                success: true,
                data: {
                    user: {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email,
                    },
                    token: result.token,
                },
            });
        } catch (error: any) {
            // In production, you would want a more robust error handler
            return reply.status(400).send({
                success: false,
                message: error.message,
            });
        }
    }

    async login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
        try {
            const { email, password } = request.body;
            const result = await this.userService.login(email, password);

            return reply.send({
                success: true,
                data: {
                    user: {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email,
                    },
                    token: result.token,
                },
            });
        } catch (error: any) {
            return reply.status(401).send({
                success: false,
                message: error.message,
            });
        }
    }

    async verifyEmail(request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) {
        try {
            const { token } = request.params;
            await this.userService.verifyEmail(token);

            return reply.send({
                success: true,
                message: 'Email verified successfully',
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                message: error.message,
            });
        }
    }
}