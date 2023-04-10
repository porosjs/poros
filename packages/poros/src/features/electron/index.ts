import WebpackBar from '@umijs/bundler-webpack/compiled/webpackbar';
import ProgressPlugin from '@umijs/bundler-webpack/dist/plugins/ProgressPlugin';
import { Env } from '@umijs/bundler-webpack/dist/types';
import * as path from 'path';
import type { IApi } from 'umi';
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
    config.target('electron-renderer');

    if (api.env === Env.production) {
      config.plugin('progress-plugin').use(WebpackBar, [
        {
          name: 'RendererProcess',
        },
      ]);
    } else {
      config.plugin('progress-plugin-dev').use(ProgressPlugin, [
        {
          name: 'RendererProcess',
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

  // api.onGenerateFiles(() => {
  //   api.writeTmpFile({
  //     path: 'main/createProtocol.ts',
  //     context: {},
  //     tplPath: path.join(__dirname, '../../tpls/main/createProtocol.ts.tpl'),
  //   });
  // });
};
