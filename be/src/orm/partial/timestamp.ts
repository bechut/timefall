import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class TimestampPartial {
  @CreateDateColumn({ type: 'timestamp without time zone' })
  created: Date;
  @UpdateDateColumn({ type: 'timestamp without time zone' })
  updated: Date;
}
