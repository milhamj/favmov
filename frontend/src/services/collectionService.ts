import { Collection } from '../model/collectionModel';
import { Success, Error } from '../model/apiResponse';
import backendClient from './backendClient';

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