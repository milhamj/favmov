import { Movie } from './movieModel';

export class Collection {
  id: number;
  name: string;
  movies?: Movie[];
  userId?: string;
  createdAt?: string;
  lastUpdated?: string;
  moviesCount?: number;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}