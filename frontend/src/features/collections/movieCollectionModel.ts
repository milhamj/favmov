export type MovieCollection = {
  id: number;
  userId: string;
  collectionId: string;
  createdAtTime: number;
  isTvShow: boolean;
  movieId?: string;
  tvShowId?: string;
  notes?: string;
};
