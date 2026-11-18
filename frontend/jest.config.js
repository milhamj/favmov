module.exports = {
  preset: 'jest-expo',
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      { caller: { name: 'metro', bundler: 'metro', platform: 'ios', preserveEnvVars: true } },
    ],
  },
  testTimeout: 15000,
  maxWorkers: '100%', // default is cores - 1
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/src/app/'],
  transformIgnorePatterns: [
    'node_modules/(?!((?:.pnpm/)?(?:react-native|@react-native|expo|@expo|@unimodules|unimodules|react-navigation|@react-navigation)))',
  ],
};
