const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');


module.exports = env => {

  const isProd = env === 'prod';

  const filesToCopy = [
    'src/index.html',
    'assets/tex.png',
    'levels/*.*',
  ];

  const plugins = [
    new CopyWebpackPlugin(filesToCopy),
  ];

  if (isProd) {
    plugins.push(new WebpackShellPlugin({
      onBuildEnd: ['./compress-tex.js'],
    }));
  }

  return {
    entry: './src/index.ts',
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist')
    },
    plugins: plugins,
    devtool: isProd ? false : 'source-map',
  };
};
