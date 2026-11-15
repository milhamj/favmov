import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { searchPeople, fetchPeopleDetails } from './peopleService';

export function useSearchPeople(query: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['people', 'search', { query }],
    queryFn: async ({ pageParam }) => searchPeople(query, pageParam),
    enabled: Boolean(query) && enabled,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages, page) =>
      lastPage.people.length && page < lastPage.totalPages && page < 500 ? page + 1 : undefined,
    staleTime: Infinity,
  });
}

export function usePeopleDetails(id: string) {
  return useQuery({
    queryKey: ['people', 'detail', { id }],
    queryFn: async () => fetchPeopleDetails(id),
    enabled: id !== '',
    staleTime: Infinity,
  });
}
