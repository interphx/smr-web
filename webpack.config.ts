import * as path from 'path';
import * as webpack from 'webpack';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
    context: path.join(__dirname, 'src'),
    entry: { main: './app.ts' },
    devtool: 'source-map',
    output: {
        path: path.join(__dirname, 'dist/'),
        filename: 'bundle.js'
    },
	devServer: {
		contentBase: path.join(__dirname, 'dist'),
		host: 'localhost',
		open: false
	},
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Super Metal Runner',
            template: 'templates/index.html.ejs'
        }),
        new CopyWebpackPlugin([
            { from: 'assets/', to: 'assets/' },
            { from: 'static/', to: '' }
        ])
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        getCustomTransformers: (program: any) => ({
                            before: []
                        })
                    }
                }
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[hash].[ext]'
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            url: false,
                            modules: true,
                            camelCase: 'dashes'
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        modules: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')],
        extensions: ['.tsx', '.ts', '.js', '.jsx', '.json']
    }
};

export default config;