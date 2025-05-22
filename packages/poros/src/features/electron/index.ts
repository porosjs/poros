import WebpackBar from '@umijs/bundler-webpack/compiled/webpackbar';
import ProgressPlugin from '@umijs/bundler-webpack/dist/plugins/ProgressPlugin';
import { Env } from '@umijs/bundler-webpack/dist/types';
import assert from 'assert';
import * as path from 'path';
import type { IApi } from 'umi';
import { runBuild, runDev } from './compile';

export default (api: IApi) => {
  api.describe({ key: 'electron' });

  api.modifyDefaultConfig((config) => {
    config.outputPath = path.join(process.cwd(), config.outputPath ?? 'dist', 'bundled');

    assert(!api.userConfig.history?.type || api.userConfig.history?.type === 'hash', '[poros/config]:  History type in electron must be hash');

    config.history = {
      type: 'hash',
    };

    config.mfsu = false;

    return config;
  });

  api.chainWebpack((config) => {
    config.target(api.config.rendererTarget ?? 'web');

    if (api.env === Env.production) {
      config.plugin('progress-plugin').use(WebpackBar, [
        {
          name: 'Renderer',
        },
      ]);
    } else {
      config.plugin('progress-plugin-dev').use(ProgressPlugin, [
        {
          name: 'Renderer',
        },
      ]);
    }

    return config;
  });

  api.onDevCompileDone(({ isFirstCompile }) => {
    if (isFirstCompile) {
      runDev(api).catch((error) => {
        console.error(error);
      });
    }
  });

  api.onBuildComplete(({ err }) => {
    if (err == null && !process.env.ANALYZE) {
      runBuild(api).catch((error) => {
        console.error(error);
      });
    }
  });
};
