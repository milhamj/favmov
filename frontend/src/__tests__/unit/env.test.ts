test('missing environment variable names the variable', () => {
  const previous = process.env.EXPO_PUBLIC_TMDB_TOKEN;
  delete process.env.EXPO_PUBLIC_TMDB_TOKEN;
  try {
    jest.isolateModules(() => {
      expect(() => require('@/lib/env')).toThrow('EXPO_PUBLIC_TMDB_TOKEN');
    });
  } finally {
    process.env.EXPO_PUBLIC_TMDB_TOKEN = previous;
  }
});
