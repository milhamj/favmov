import { useEffect, useMemo, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
    const latest = useRef(callback);
    latest.current = callback;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const args = useRef<Parameters<T> | null>(null);
    const debounced = useMemo(() => {
        const cancel = () => {
            if (timer.current !== null) clearTimeout(timer.current);
            timer.current = null;
            args.current = null;
        };
        const flush = () => {
            const pending = args.current;
            cancel();
            if (pending) latest.current(...pending);
        };
        return Object.assign((...pending: Parameters<T>) => {
            cancel();
            args.current = pending;
            timer.current = setTimeout(flush, delay);
        }, { cancel, flush });
    }, [delay]);
    useEffect(() => debounced.cancel, [debounced]);
    return debounced;
}
