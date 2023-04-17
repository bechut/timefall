import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  Unique,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Profile } from './profile.entity';
import { TimestampPartial } from '../partial/timestamp';
import { Otp } from './otp.entity';

@Entity()
@Unique('UQ_EMAIL', ['email'])
@Index('IDX_email', ['email'])
export class User extends TimestampPartial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '', nullable: false })
  email: string;

  @Column({ default: '' })
  password: string;

  @Column({ default: false })
  is_active: boolean;

  @OneToOne(() => Profile, (profile: Profile) => profile.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  profile: Profile;

  @OneToMany(() => Otp, (otp: Otp) => otp.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  otp: Otp[];
}
