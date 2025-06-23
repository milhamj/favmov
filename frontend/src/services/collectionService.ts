import { Collection } from '../model/collectionModel';
import { Success, Error } from '../model/apiResponse';
import backendClient from './backendClient';

export const createCollection = async (
  name: string
): Promise<Success<Collection> | Error> => {
  try {
    const response = await backendClient.post('/collections', { name });
    
    const collection = new Collection(
      response.data.data.id,
      response.data.data.name,
    );
    if (response.data.data.user_id) {
        collection.userId = response.data.data.user_id;
    }
    if (response.data.data.created_at) {
        collection.createdAt = response.data.data.created_at;
    }
    
    return new Success<Collection>(collection, 'Collection created successfully');
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
        const collection = new Collection(item.id, item.name)
        if (item.user_id) {
            collection.userId = item.user_id;
        }
        if (item.created_at) {
            collection.createdAt = item.created_at;
        }
        return collection;
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