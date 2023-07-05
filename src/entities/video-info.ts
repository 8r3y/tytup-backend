import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class VideoInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column()
  duration: string;

  @Column()
  author: string;

  @Column()
  preview?: string;

  @Column()
  views?: string;

  @Column({ default: '' })
  description: string;

  @Column()
  createdAt: number;
}
