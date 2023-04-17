import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TimestampPartial } from '../partial/timestamp';

@Entity()
export class Otp extends TimestampPartial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '', nullable: false })
  value: string;

  @Column({ default: '', nullable: false })
  context: string;

  @Column({ default: false, nullable: false })
  is_verify: boolean;

  @ManyToOne(() => User, (user: User) => user.id)
  @JoinColumn()
  user: User;

  @Column()
  expired: Date;
}
