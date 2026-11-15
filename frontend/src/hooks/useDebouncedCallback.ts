import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

export function useDebouncedCallback(callback: () => void, delay: number) {
  const latest = useRef(callback);
  useLayoutEffect(() => {
    latest.current = callback;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounced = useMemo(() => {
    const cancel = () => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    };
    const run = () => {
      cancel();
      timer.current = setTimeout(() => {
        timer.current = null;
        latest.current();
      }, delay);
    };
    run.cancel = cancel;
    return run;
  }, [delay]);
  useEffect(() => debounced.cancel, [debounced]);
  return debounced;
}
