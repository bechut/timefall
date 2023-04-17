import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { TimestampPartial } from '../partial/timestamp';
import { DEFAULT_COLORS } from '../../constants/workspace';

const description_default =
  'Use the Main Workspace to manage and collaborate on all company-wide boards. All team members are in this workspace.';

@Entity()
export class Workspace extends TimestampPartial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '', nullable: false })
  name: string;

  @Column({ default: description_default, nullable: true })
  description: string;

  @Column({ default: '', nullable: true })
  icon: string;

  @Column({
    default: DEFAULT_COLORS[0],
    nullable: true,
  })
  icon_background_color: string;

  @OneToOne(() => User, (user: User) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  owner: User;
}
