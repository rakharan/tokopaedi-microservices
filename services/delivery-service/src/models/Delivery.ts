import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum DeliveryStatus {
    PENDING = "PENDING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}

@Entity()
export class Delivery {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    orderId!: number;

    @Column({ type: "varchar", length: 255 })
    address!: string;

    @Column({
        type: "enum",
        enum: DeliveryStatus,
        default: DeliveryStatus.PENDING
    })
    status!: DeliveryStatus;

    @Column({ type: "varchar", length: 255, nullable: true })
    trackingNumber!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}