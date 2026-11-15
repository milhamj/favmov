import { Collection } from './collectionModel';
import { ApiError, toApiError } from '@/lib/apiError';
import backendClient from '@/lib/backendClient';
import { Movie } from '@/features/movies/movieModel';
import { MovieCollection } from './movieCollectionModel';

interface CollectionRow {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
  last_updated?: string;
  movies_count?: number;
}
export interface MovieRow {
  id: number;
  title: string;
  poster_path?: string;
  is_tv_show?: boolean;
  rating?: string | number | null;
  rating_count?: number | null;
  notes?: string;
  last_added_at?: string;
  created_at?: string;
  release_date?: string;
}
interface MembershipRow {
  id: number;
  user_id: string;
  collection_id: string;
  created_at: string;
  is_tv_show: boolean;
  tv_show_id?: string;
  movie_id?: string;
  notes?: string;
}
interface BackendResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  status?: number;
}

const transformCollectionData = (data: CollectionRow): Collection => {
  const collection: Collection = { id: data.id, name: data.name };
  if (data.user_id) {
    collection.userId = data.user_id;
  }
  if (data.created_at) {
    collection.createdAt = data.created_at;
  }
  if (data.last_updated) {
    collection.lastUpdated = data.last_updated;
  }
  if (data.movies_count) {
    collection.moviesCount = data.movies_count;
  }
  return collection;
};

// One backend row (a collection's movie or a favorite) to a Movie; the two lists name the added-at column differently
export const movieFromRow = (item: MovieRow): Movie => {
  const movie: Movie = {
    id: item.id ?? 0,
    title: item.title ?? '',
    posterPath: item.poster_path ?? '',
  };
  movie.isTvShow = item.is_tv_show;
  const rating = parseFloat(String(item.rating));
  if (Number.isFinite(rating)) {
    movie.rating = rating.toFixed(2);
  }
  if (item.rating_count != null) {
    movie.ratingCount = item.rating_count;
  }
  if (item.notes) {
    movie.collectionNotes = item.notes;
  }
  const addedAt = item.last_added_at ?? item.created_at;
  if (addedAt) {
    movie.collectionAddTime = new Date(addedAt).getTime();
  }
  if (item.release_date) {
    movie.releaseDate = item.release_date;
  }
  return movie;
};

export const createCollection = async (name: string): Promise<Collection> => {
  try {
    const response = await backendClient.post<BackendResponse<CollectionRow>>('/collections', {
      name,
    });
    return transformCollectionData(response.data.data);
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to create collection', true);
  }
};

export const getUserCollections = async (): Promise<Collection[]> => {
  try {
    const response = await backendClient.get<BackendResponse<CollectionRow[]>>('/collections');

    const collections = response.data.data.map((item) => {
      return transformCollectionData(item);
    });

    return collections;
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to fetch collections', true);
  }
};

export const getCollectionDetail = async (id: string): Promise<Collection> => {
  try {
    const response = await backendClient.get<
      BackendResponse<CollectionRow & { movies: MovieRow[] }>
    >(`/collections/${encodeURIComponent(id)}/movies`);

    const collection = transformCollectionData(response.data.data);

    collection.movies = response.data.data.movies.map((item) => {
      return movieFromRow(item);
    });

    return collection;
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to fetch collection detail', true);
  }
};

export const getCheckMovieExistInCollection = async (
  movieId: string,
  isTvShow: boolean,
): Promise<Collection[]> => {
  try {
    const response = await backendClient.get<
      BackendResponse<{ collection_id: string; collection_name: string; notes?: string }[]>
    >(`/collections/check_exist/${movieId}?is_tv_show=${isTvShow}`);
    const collections = response.data.data.map((item) => {
      const collection: Collection = { id: item.collection_id, name: item.collection_name };
      if (item.notes) {
        collection.moviesCollectionNotes = item.notes;
      }
      return collection;
    });

    return collections;
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to check your collections', true);
  }
};

export const postAddMovieToCollection = async (
  collectionId: string,
  movie: Movie,
  isTvShow: boolean,
): Promise<MovieCollection> => {
  try {
    const response = await backendClient.post<BackendResponse<MembershipRow>>(
      `/collections/${encodeURIComponent(collectionId)}/movies`,
      {
        movie_id: !isTvShow ? movie.id : undefined,
        tv_show_id: isTvShow ? movie.id : undefined,
        title: movie.title,
        poster_path: movie.posterPath?.trim() || null,
        rating: movie.rating ? movie.rating : null,
        rating_count: movie.ratingCount ?? null,
        release_date: movie.releaseDate ? movie.releaseDate : null,
        is_tv_show: isTvShow,
      },
    );

    if (!response.data.success) {
      throw new ApiError(
        response.data.message ||
          `Failed to add ${isTvShow ? 'tv show' : 'movie'} to the collection.`,
        response.data.status,
      );
    }

    const movieCollection: MovieCollection = {
      id: response.data.data.id,
      userId: response.data.data.user_id,
      collectionId: response.data.data.collection_id,
      createdAtTime: new Date(response.data.data.created_at).getTime(),
      isTvShow: response.data.data.is_tv_show,
    };

    if (isTvShow) {
      movieCollection.tvShowId = response.data.data.tv_show_id;
    } else {
      movieCollection.movieId = response.data.data.movie_id;
    }

    if (response.data.data.notes) {
      movieCollection.notes = response.data.data.notes;
    }

    return movieCollection;
  } catch (error: unknown) {
    throw toApiError(
      error,
      `Failed to add ${isTvShow ? 'tv show' : 'movie'} to the collection.`,
      true,
    );
  }
};

export const deleteMovieFromCollection = async (
  collectionId: string,
  movieId: string,
  isTvShow: boolean,
): Promise<boolean> => {
  try {
    const response = await backendClient.delete<BackendResponse<unknown>>(
      `/collections/${encodeURIComponent(collectionId)}/movies/${movieId}?is_tv_show=${isTvShow}`,
    );

    if (!response.data.success) {
      throw new ApiError(
        response.data.message ||
          `Failed to remove ${isTvShow ? 'tv show' : 'movie'} from the collection.`,
        response.data.status,
      );
    }

    return true;
  } catch (error: unknown) {
    throw toApiError(
      error,
      `Failed to remove ${isTvShow ? 'tv show' : 'movie'} from the collection.`,
      true,
    );
  }
};

export const updateNotes = async (
  collectionId: string,
  movieId: string,
  isTvShow: boolean,
  notes: string,
): Promise<boolean> => {
  try {
    const response = await backendClient.post<BackendResponse<unknown>>(
      `/collections/${encodeURIComponent(collectionId)}/movies/${movieId}/notes`,
      {
        notes: notes,
        is_tv_show: isTvShow,
      },
    );

    if (!response.data.success) {
      throw new ApiError(
        response.data.message ||
          `Failed to update the ${isTvShow ? 'tv show' : 'movie'}'s notes to the collection.`,
        response.data.status,
      );
    }

    return true;
  } catch (error: unknown) {
    throw toApiError(
      error,
      `Failed to update the ${isTvShow ? 'tv show' : 'movie'}'s notes to the collection.`,
      true,
    );
  }
};
