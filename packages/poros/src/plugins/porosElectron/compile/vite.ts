import * as path from 'path';
import { IApi } from 'umi';
import { InlineConfig } from 'vite';
import externalPackages from '../external-packages.config';
import { ElectronBuilder } from '../types';
import {
  getBuildDir,
  getDevBuildDir,
  getMainSrc,
  getPreloadSrc,
} from '../utils';

/**
 * 获取主进程vite配置
 * @param api
 */
export function getMainViteConfig(api: IApi): InlineConfig {
  const mode = api.env || 'development';
  const { externals, viteConfig } = api.config
    .electronBuilder as ElectronBuilder;

  const external = [...externalPackages, ...externals];

  const mainConfig: InlineConfig = {
    mode,
    resolve: {
      alias: {
        '@/common': path.join(process.cwd(), 'src/common'),
        '@': getMainSrc(api),
      },
    },
    root: getMainSrc(api),
    build: {
      sourcemap: mode === 'development' ? 'inline' : false,
      outDir: mode === 'development' ? getDevBuildDir(api) : getBuildDir(api),
      assetsDir: '.',
      minify: mode !== 'development',
      lib: {
        entry: 'index.ts',
        formats: ['cjs'],
      },
      rollupOptions: {
        external,
        output: {
          entryFileNames: 'main.js',
        },
      },
      emptyOutDir: false,
    },
  };
  viteConfig(mainConfig, 'main');
  return mainConfig;
}

export function getPreloadViteConfig(
  api: IApi,
  inputFileName: string,
  outputFileName: string,
): InlineConfig {
  const mode = api.env || 'development';
  const { externals, viteConfig } = api.config
    .electronBuilder as ElectronBuilder;

  const external = [...externalPackages, ...externals];

  const preloadConfig: InlineConfig = {
    mode,
    resolve: {
      alias: {
        '@/common': path.join(process.cwd(), 'src/common'),
        '@': getPreloadSrc(api),
      },
    },
    root: getPreloadSrc(api),
    build: {
      sourcemap: mode === 'development' ? 'inline' : false,
      outDir: mode === 'development' ? getDevBuildDir(api) : getBuildDir(api),
      assetsDir: '.',
      minify: mode !== 'development',
      lib: {
        entry: inputFileName,
        formats: ['cjs'],
      },
      rollupOptions: {
        external,
        output: {
          entryFileNames: outputFileName,
        },
      },
      emptyOutDir: false,
    },
  };
  viteConfig(preloadConfig, 'preload');
  return preloadConfig;
}
