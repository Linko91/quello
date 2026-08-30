import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import QuelloWebpackPlugin from 'webpack-plugin-quello'

const here = dirname(fileURLToPath(import.meta.url))

export default {
  entry: './src/main.js',
  output: { path: resolve(here, 'dist'), filename: 'bundle.js', clean: true },
  module: { rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader'] }] },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html', title: 'quello · webpack playground' }),
    new QuelloWebpackPlugin(),
  ],
  devServer: {
    port: 5182,
    historyApiFallback: true,
    static: false,
  },
}
