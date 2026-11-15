import { startTransition, useEffect, useState } from 'react';

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Let prerendered Suspense boundaries hydrate before changing their content.
    startTransition(() => setHydrated(true));
  }, []);
  return hydrated;
}
