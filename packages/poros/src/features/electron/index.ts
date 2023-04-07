import * as path from 'path';
import type { IApi } from 'umi';
import { runBuild, runDev } from './compile';

export default (api: IApi) => {
  api.modifyConfig((config) => {
    config.outputPath = path.join(process.cwd(), config.outputPath, 'bundled');

    config.history = {
      type: 'hash',
    };

    config.externals = { electron: `require('electron')`, ...config.externals };
    return config;
  });

  api.chainWebpack((config) => {
    config.target('electron-renderer');
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

  api.onGenerateFiles(() => {
    api.writeTmpFile({
      path: 'main/createProtocol.ts',
      context: {},
      tplPath: path.join(__dirname, '../../tpls/main/createProtocol.ts.tpl'),
    });
  });
};
