import { Collection } from '../model/collectionModel';
import { Success, Error } from '../model/apiResponse';
import backendClient from './backendClient';
import { Movie } from '../model/movieModel';
import { MovieCollection } from '../model/movieCollectionModel';

const transformCollectionData = (data: any): Collection => {
  const collection = new Collection(
    data.id,
    data.name,
  );
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
}

const transformMovieData = (item: any): Movie => {
  const movie = new Movie({
    id: item.id,
    title: item.title,
    posterPath: item.poster_path
  });
  movie.isTvShow = item.is_tv_show;
  if (item.rating) {
    movie.rating = item.rating;
  }
  if (item.rating_count) {
    movie.ratingCount = item.rating_count;
  }
  if (item.notes) {
    movie.collectionNotes = item.notes;
  }
  if (item.created_at) {
    movie.collectionAddTime = new Date(item.created_at).getTime();
  }
  if (item.release_date) {
    movie.releaseDate = item.release_date;
  }
  return movie;
}

export const createCollection = async (
  name: string
): Promise<Success<Collection> | Error> => {
  try {
    const response = await backendClient.post('/collections', { name });
    return new Success<Collection>(transformCollectionData(response.data.data), 'Collection created successfully');
  } catch (error: any) {
    console.error('Error creating collection:', error);
    return new Error(
      error.response?.data?.message || 'Failed to create collection',
      error.response?.status
    );
  }
};

export const getUserCollections = async (): Promise<Success<Collection[]> | Error> => {
  try {
    const response = await backendClient.get('/collections');
    
    const collections = response.data.data.map((item: any) => {
        return transformCollectionData(item);
    });
    
    return new Success<Collection[]>(collections, 'Collections retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    return new Error(
      error.response?.data?.message || 'Failed to fetch collections',
      error.response?.status
    );
  }
};

export const getCollectionDetail = async (id: string): Promise<Success<Collection> | Error> => {
  try {
    const response = await backendClient.get(`/collections/${id}/movies`);
    
    const collection = transformCollectionData(response.data.data);

    collection.movies = response.data.data.movies.map((item: any) => {
      return transformMovieData(item);
    });
    
    return new Success<Collection>(collection, 'Collection detail retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching collection detail:', error);
    return new Error(
      error.response?.data?.message || 'Failed to fetch collection detail',
      error.response?.status
    );
  }
};

export const getCheckMovieExistInCollection = async (movieId: string, isTvShow: boolean): Promise<Success<Collection[]> | Error> => {
  try {
    const response = await backendClient.get(`/collections/check_exist/${movieId}?is_tv_show=${isTvShow}`);
    const collections = response.data.data.map((item: any) => {
      const collection = new Collection(item.collection_id, item.collection_name);
      if (item.notes) {
        collection.moviesCollectionNotes = item.notes;
      }
      return collection;
    });
    
    return new Success<Collection[]>(collections, 'Collection detail retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching collection detail:', error);
    return new Error(
      error.response?.data?.message || 'Failed to fetch collection detail',
      error.response?.status
    );
  }
};

export const postAddMovieToCollection = async (
  collectionId: string, 
  movie: Movie, 
  isTvShow: boolean
): Promise<Success<MovieCollection> | Error> => {
  try {
    const response = await backendClient.post(`/collections/${collectionId}/movies`, {
      movie_id: !isTvShow ? movie.id : undefined,
      tv_show_id: isTvShow ? movie.id : undefined,
      title: movie.title,
      poster_path: movie.posterPath,
      rating: movie.rating ? movie.ratingCount : null,
      rating_count: movie.ratingCount ? movie.ratingCount : null,
      release_date: movie.releaseDate ? movie.releaseDate : null,
      is_tv_show: isTvShow,
    });

    if (!response.data.success) {
      return new Error(
        response.data.message || `Failed to add ${isTvShow ? "movie" : "tv show"} to the collection.`,
        response.data.status
      );
    }
    
    const movieCollection = new MovieCollection(
      response.data.data.id,
      response.data.data.user_id,
      response.data.data.collection_id,
      new Date(response.data.data.created_at).getTime(),
      response.data.data.is_tv_show,
    );

    if (isTvShow) {
      movieCollection.tvShowId = response.data.data.tv_show_id;
    } else {
      movieCollection.movieId = response.data.data.movie_id;
    }

    if (response.data.data.notes) {
      movieCollection.notes = response.data.data.notes;
    }
    
    return new Success<MovieCollection>(movieCollection, 'Movie has been added to the collection successfully.');
  } catch (error: any) {
    console.error('Error removing movie from the collection:', error);
    return new Error(
      error.response?.data?.message || `Failed to add ${isTvShow ? "movie" : "tv show"} to the collection.`,
      error.response?.status
    );
  }
};

export const deleteMovieFromCollection = async (
  collectionId: string, 
  movieId: string, 
  isTvShow: boolean
): Promise<Success<boolean> | Error> => {
  try {
    const response = await backendClient.delete(`/collections/${collectionId}/movies/${movieId}?is_tv_show=${isTvShow}`);
    
    if (!response.data.success) {
      return new Error(
        response.data.message || `Failed to remove ${isTvShow ? "movie" : "tv show"} from the collection.`,
        response.data.status
      );
    }
    
    return new Success<boolean>(true, 'Movie has been removed from the collection successfully.');
  } catch (error: any) {
    console.error('Error removing movie from collection:', error);
    return new Error(
      error.response?.data?.message || `Failed to remove ${isTvShow ? "movie" : "tv show"} from the collection.`,
      error.response?.status
    );
  }
};

export const updateNotes = async (
  collectionId: string, 
  movieId: string, 
  isTvShow: boolean,
  notes: string
): Promise<Success<boolean> | Error> => {
  try {
    const response = await backendClient.post(`/collections/${collectionId}/movies/${movieId}/notes`, {
      notes: notes,
      is_tv_show: isTvShow,
    });
    
    if (!response.data.success) {
      return new Error(
        response.data.message || `Failed to update the ${isTvShow ? "movie" : "tv show"}'s notes to the collection.`,
        response.data.status
      );
    }
    
    return new Success<boolean>(true, `${isTvShow ? "Movie" : "TV Show"}'s notes has been updated successfully.`);
  } catch (error: any) {
    console.error('Error removing movie from collection:', error);
    return new Error(
      error.response?.data?.message || `Failed to update the ${isTvShow ? "movie" : "tv show"}'s notes to the collection.`,
      error.response?.status
    );
  }
};