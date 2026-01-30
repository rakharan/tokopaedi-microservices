import { FastifyReply, FastifyRequest } from 'fastify';
import { OrderService } from '../services/OrderService';

interface CreateOrderBody {
  items: { productId: number; quantity: number }[];
}

export class OrderController {
  constructor(private orderService: OrderService) {}

  async create(request: FastifyRequest<{ Body: CreateOrderBody }>, reply: FastifyReply) {
    try {
      // Hardcoded User ID for now (until we add Auth Middleware)
      const userId = 1; 
      const { items } = request.body;

      if (!items || items.length === 0) {
        return reply.status(400).send({ success: false, message: 'No items provided' });
      }

      const order = await this.orderService.createOrder(userId, items);
      
      return reply.status(201).send({
        success: true,
        data: order,
      });

    } catch (error: any) {
      // If it's an inventory error, it usually looks like "Insufficient stock"
      return reply.status(400).send({
        success: false,
        message: error.message,
      });
    }
  }
}