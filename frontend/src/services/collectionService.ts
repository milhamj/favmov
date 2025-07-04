import { Collection } from '../model/collectionModel';
import { Success, Error } from '../model/apiResponse';
import backendClient from './backendClient';
import { Movie } from '../model/movieModel';

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
  const movie = new Movie(
    item.id,
    item.title,
    item.poster_path
  );
  movie.isTvShow = item.is_tv_show;
  if (item.rating) {
    movie.rating = item.rating;
  }
  if (item.rating_count) {
    movie.ratingCount = item.rating_count;
  }
  if (item.notes) {
    movie.collectionNotes = item.notes
  }
  if (item.created_at) {
    movie.collectionAddTime = new Date(item.created_at).getTime();
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
      return transformCollectionData(item);
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