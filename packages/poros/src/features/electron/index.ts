import WebpackBar from '@porosjs/bundler-webpack/compiled/webpackbar';
import ProgressPlugin from '@porosjs/bundler-webpack/dist/plugins/ProgressPlugin';
import { Env } from '@porosjs/bundler-webpack/dist/types';
import type { IApi } from '@porosjs/umi';
import assert from 'assert';
import * as path from 'path';
import { runBuild, runDev } from './compile';

export default (api: IApi) => {
  api.describe({ key: 'electron' });

  api.modifyDefaultConfig((config) => {
    config.outputPath = path.join(
      process.cwd(),
      config.outputPath ?? 'dist',
      'bundled',
    );

    assert(
      !api.userConfig.history?.type || api.userConfig.history?.type === 'hash',
      '[poros/config]:  History type in electron must be hash',
    );

    config.history = {
      type: 'hash',
    };

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
    if (err == null) {
      runBuild(api).catch((error) => {
        console.error(error);
      });
    }
  });
};
