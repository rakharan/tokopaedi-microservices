import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price!: number;

    @Column('int')
    stock!: number;

    @Column({ type: 'int' })
    category!: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // THE SECRET WEAPON: Optimistic Locking
    // This number increments automatically every time you save.
    // If User A and User B try to buy the last item at the exact same moment:
    // 1. Both read version: 1
    // 2. User A saves first -> version becomes 2
    // 3. User B tries to save with version 1 -> Database REJECTS it because current is 2
    @VersionColumn()
    version!: number;
}