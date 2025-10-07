import { Movie } from './movieModel';

export class Collection {
  id: string;
  name: string;
  movies?: Movie[];
  userId?: string;
  createdAt?: string;
  lastUpdated?: string;
  moviesCount?: number;
  moviesCollectionNotes?: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class CollectionCard extends Collection {
  isInCollection: boolean

  constructor(id: string, name: string, isInCollection: boolean) {
      super(id, name)
      this.isInCollection = isInCollection;
  }
}