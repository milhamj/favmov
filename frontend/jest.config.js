module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/src/app/'],
  transformIgnorePatterns: ['node_modules/(?!((?:.pnpm/)?(?:react-native|@react-native|expo|@expo|@unimodules|unimodules|react-navigation|@react-navigation)))'],
};
