import { useCallback, useRef, useState } from 'react';
import { Error, Success } from '../model/apiResponse';

// Infinite-list paging: a failed page stays retryable, and responses from before a reset are ignored.
export function usePagedFetch(initiallyLoading: boolean) {
    const page = useRef(0);
    const generation = useRef(0);
    const fetching = useRef(false);
    const hasMore = useRef(false);
    const [failedPage, setFailedPage] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(initiallyLoading);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const load = useCallback(async <T,>(
        newPage: number,
        request: () => Promise<Success<T> | Error | null>,
        apply: (data: T) => boolean, // whether another page exists
        onSettled?: () => void
    ) => {
        if (fetching.current) return;
        const requestGeneration = generation.current;
        fetching.current = true;
        setFailedPage(null);
        setIsLoading(newPage === 1);
        setIsLoadingMore(newPage > 1);
        try {
            const result = await request();
            if (requestGeneration !== generation.current) return;
            if (result instanceof Success) {
                page.current = newPage;
                hasMore.current = apply(result.data);
            } else if (result !== null) setFailedPage(newPage);
        } catch (error) {
            console.error('Error fetching page:', error);
            if (requestGeneration !== generation.current) return;
            setFailedPage(newPage);
        }
        setIsLoading(false);
        setIsLoadingMore(false);
        fetching.current = false;
        onSettled?.();
    }, []);
    const reset = useCallback((loading: boolean) => {
        generation.current += 1;
        fetching.current = false;
        page.current = 0;
        hasMore.current = false;
        setFailedPage(null);
        setIsLoading(loading);
        setIsLoadingMore(false);
    }, []);
    const canLoadMore = () => failedPage === null && hasMore.current && !fetching.current;

    return { page, failedPage, isLoading, isLoadingMore, load, reset, canLoadMore };
}
