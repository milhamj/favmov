export class MovieCollection {
  id: number;
  userId: string;
  collectionId: string;
  createdAtTime: number;
  isTvShow: boolean;
  movieId?: string;
  tvShowId?: string;
  notes?: string;

  constructor(id: number, userId: string, collectionId: string, createdAtTime: number, isTvShow: boolean) {
    this.id = id;
    this.userId = userId;
    this.collectionId = collectionId;
    this.createdAtTime = createdAtTime;
    this.isTvShow = isTvShow;
  }
}