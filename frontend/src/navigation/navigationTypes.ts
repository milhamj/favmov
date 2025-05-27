import { Movie } from '../model/movieModel';

export type RootStackParamList = {
  Home: undefined;
  Collection: undefined;
  Profile: undefined;
  MovieDetail: { movie: Movie };
  SearchPage: undefined;
  Login: undefined;
};