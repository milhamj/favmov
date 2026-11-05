import { useEffect, useMemo, useRef } from 'react';

export function useDebouncedCallback(callback: () => void, delay: number) {
    const latest = useRef(callback);
    latest.current = callback;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debounced = useMemo(() => {
        const cancel = () => {
            if (timer.current !== null) clearTimeout(timer.current);
            timer.current = null;
        };
        return Object.assign(() => {
            cancel();
            timer.current = setTimeout(() => {
                timer.current = null;
                latest.current();
            }, delay);
        }, { cancel });
    }, [delay]);
    useEffect(() => debounced.cancel, [debounced]);
    return debounced;
}
