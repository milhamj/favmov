import { Movie } from './movieModel';

export class Collection {
  id: number;
  name: string;
  movies?: Movie[];
  userId?: string;
  createdAt?: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}