import { Movie } from '../model/movieModel';

export type RootStackParamList = {
  MainPage: { activeTab?: string } | undefined;
  MovieDetailPage: { movie: Movie };
  SearchPage: undefined;
  CollectionDetailPage: { collectionId: string };
  AddToCollectionPage: { movie: Movie };
  LoginPage: undefined;
};