const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');



module.exports = env => {

  const isProd = env === 'prod';

  const bundleName = isProd ? 'bundle.js' : 'sa.js';

  const filesToCopy = [
    'src/index.html',
    'assets/tex.png',
    'levels/*.*',
  ];

  const plugins = [
    new CopyWebpackPlugin(filesToCopy),
  ];

  if (isProd) {
    filesToCopy.push({
      from: 'node_modules/lzma/src/lzma-d-min.js',
      to: 'lzma.js',
    });
    filesToCopy.push('src/sa.js');

    plugins.push(new WebpackShellPlugin({
      onBuildEnd: ['./compress-bundle.js', './compress-tex.js'],
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
      filename: bundleName,
      path: path.resolve(__dirname, 'dist')
    },
    plugins: plugins,
    devtool: isProd ? false : 'source-map',
  };
};
