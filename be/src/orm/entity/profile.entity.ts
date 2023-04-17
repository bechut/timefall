import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '', nullable: false })
  first_name: string;

  @Column({ default: '', nullable: false })
  last_name: string;

  @Column({ nullable: true })
  gender: number;

  @Column({ nullable: true })
  age: number;

  @Column({ default: '', nullable: true })
  avatar: string;
}
