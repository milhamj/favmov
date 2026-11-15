export const favoritesKey = (authenticated: boolean, userId?: string) =>
  ['collections', 'favorites', { authenticated, userId }] as const;
