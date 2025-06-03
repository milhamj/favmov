import { Movie } from '../model/movieModel';

export type RootStackParamList = {
  Main: { activeTab?: string } | undefined;
  MovieDetail: { movie: Movie };
  SearchPage: undefined;
  Login: undefined;
};