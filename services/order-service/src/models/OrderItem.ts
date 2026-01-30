import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  productId!: number;

  @Column({ type: 'varchar' })
  productName!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order!: Order;
}