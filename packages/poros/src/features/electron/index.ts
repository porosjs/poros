import WebpackBar from '@umijs/bundler-webpack/compiled/webpackbar';
import ProgressPlugin from '@umijs/bundler-webpack/dist/plugins/ProgressPlugin';
import { Env } from '@umijs/bundler-webpack/dist/types';
import { BaseGenerator } from '@umijs/utils';
import * as path from 'path';
import type { IApi } from 'umi';
import { PATHS } from '../../constants';
import { runBuild, runDev } from './compile';

export default (api: IApi) => {
  api.describe({ key: 'electron' });

  api.modifyConfig((config) => {
    config.outputPath = path.join(
      process.cwd(),
      config.outputPath ?? 'dist',
      'bundled',
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

  api.onGenerateFiles(async () => {
    const generator = new BaseGenerator({
      path: path.join(__dirname, '../../..', 'templates'),
      target: PATHS.PLUGIN_PATH,
      slient: true,
    });
    await generator.run();
  });
};
