import webpack from '@umijs/bundler-webpack/compiled/webpack';
import Config from '@umijs/bundler-webpack/compiled/webpack-5-chain';
import path from 'path';
import { IApi } from 'umi';
import externalPackages from '../external-packages.config';
import { ElectronBuilder } from '../types';
import {
  getBuildDir,
  getDevBuildDir,
  getMainSrc,
  getPreloadSrc,
} from '../utils';

function getBaseWebpackConfig(api: IApi): Config {
  const mode: 'none' | 'development' | 'production' =
    api.env === 'development' ? 'development' : 'production';
  const { externals } = api.config.electronBuilder as ElectronBuilder;

  const external: any[] = [...externalPackages, ...externals];

  const config = new Config();
  config.mode(mode);
  config.node.set('__filename', false).set('__dirname', false);
  config.devtool(mode === 'development' ? 'inline-source-map' : false);
  config.resolve.extensions.add('.ts').add('.js').add('.node');
  config.module.rule('ts').exclude.add(/node_modules/);
  config.module
    .rule('ts')
    .test(/\.ts?$/)
    .use('ts')
    .loader('ts-loader')
    .options({ transpileOnly: true });
  config.resolve.alias.set('@', path.join(process.cwd(), 'src'));

  config.externals(external);
  config.output.path(
    mode === 'development' ? getDevBuildDir(api) : getBuildDir(api),
  );

  return config;
}

/**
 * 获取主进程webpack配置
 * @param api
 */
export function getMainWebpackConfig(api: IApi) {
  const { mainWebpackChain } = api.config.electronBuilder as ElectronBuilder;
  const config = getBaseWebpackConfig(api);
  config.context(getMainSrc(api));
  config.entry('main').add('./index.ts');
  config.output.filename('main.js');
  config.target('electron-main');
  config.output.library('main').libraryTarget('commonjs2');

  mainWebpackChain(config, 'main');
  return config.toConfig();
}

/**
 * 获取preload webpack配置
 * @param api
 * @param inputFileName
 * @param outputFileName
 */
export function getPreloadWebpackConfig(
  api: IApi,
  inputFileName: string,
  outputFileName: string,
): webpack.Configuration {
  const { mainWebpackChain } = api.config.electronBuilder as ElectronBuilder;
  const config = getBaseWebpackConfig(api);
  config.context(getPreloadSrc(api));
  config.entry('preload').add(`./${inputFileName}`);
  config.output.filename(outputFileName);
  config.target('electron-preload');
  config.output.library('preload').libraryTarget('commonjs2');

  mainWebpackChain(config, 'preload');
  return config.toConfig();
}

/**
 * 打包构建
 * @param config
 */
export const build = async (config: webpack.Configuration) => {
  return await new Promise<void>((resolve, reject) => {
    const compiler = webpack(config);
    compiler.run((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
