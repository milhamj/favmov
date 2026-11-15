import { Movie } from '@/features/movies/movieModel';

export type Collection = {
  id: string;
  name: string;
  movies?: Movie[];
  userId?: string;
  createdAt?: string;
  lastUpdated?: string;
  moviesCount?: number;
  moviesCollectionNotes?: string;
};

export type CollectionCard = Collection & {
  isInCollection: boolean;
};
