import * as path from 'path';
import type { IApi } from 'umi';
import { buildElectron, runBuild, runDev } from './compile';
import { ElectronBuilder } from './types';

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

  // start dev electron
  api.onStart(() => {
    const { parallelBuild } = api.config.electronBuilder as ElectronBuilder;
    if (parallelBuild) {
      runBuild(api).catch((error) => {
        console.error(error);
      });
    }
  });

  // start dev electron
  api.onDevCompileDone(({ isFirstCompile }) => {
    if (isFirstCompile) {
      runDev(api).catch((error) => {
        console.error(error);
      });
    }
  });

  // build electron
  api.onBuildComplete(({ err }) => {
    const { parallelBuild } = api.config.electronBuilder as ElectronBuilder;

    if (err == null) {
      if (parallelBuild) {
        buildElectron(api);
      } else {
        runBuild(api)
          .then(() => buildElectron(api))
          .catch((error) => {
            console.error(error);
          });
      }
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
