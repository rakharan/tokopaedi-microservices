import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 }) 
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'tinyint', default: 3 })
  level!: number;

  @Column({ name: 'created_at', type: 'int' })
  createdAt!: number;

  @Column({ type: 'tinyint', default: 0, name: 'is_deleted' })
  isDeleted!: boolean;

  @Column({ type: 'tinyint', default: 0, name: 'is_verified' })
  isVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email_token' })
  emailToken: string | null = null; 
}