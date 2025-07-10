const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve.fallback = {
    ...config.resolve.fallback,
    url: require.resolve('url/'),
    buffer: require.resolve('buffer/'),
  };

  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  config.module.rules.push({
    test: /\.ts$/,
    type: 'javascript/auto',
    resolve: {
      fullySpecified: false
    }
  });

  return config;
};