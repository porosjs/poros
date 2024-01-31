import { IApi } from '@porosjs/umi';
import { Mustache, fsExtra, winPath } from '@umijs/utils';
import { readFileSync } from '@umijs/utils/compiled/fs-extra';
import path from 'path';
import { IPCUtils } from './utils/ipcUtils';

export default (api: IApi) => {
  api.describe({
    key: 'ipc',
    enableBy: api.EnableBy.register,
  });

  api.onGenerateFiles(async () => {
    const ipcMethods = await getAllWindowIPCHandles(api);

    const mainExportsTpl = readFileSync(
      path.join(__dirname, '../libs/ipc/main/ipcExports.tpl'),
      'utf-8',
    );
    api.writeTmpFile({
      path: 'main/ipcExports.ts',
      content: Mustache.render(mainExportsTpl, {
        electronLogPath: winPath(
          path.dirname(require.resolve('electron-log/package.json')),
        ),
      }),
    });

    const renderExportsTpl = readFileSync(
      path.join(__dirname, '../libs/ipc/renderer/ipcExports.tpl'),
      'utf-8',
    );

    api.writeTmpFile({
      path: 'renderer/ipcExports.ts',
      content: Mustache.render(renderExportsTpl, {}),
    });

    api.writeTmpFile({
      path: 'index.ts',
      content: `
export { ipcInvoker } from './renderer/ipcExports';
`,
    });
  });

  api.onBeforeCompiler(() => {
    genIPCPreload(api);
  });
  api.onBuildComplete(() => {
    genIPCPreload(api);
  });

  api.addTmpGenerateWatcherPaths(() => {
    return [path.join(process.cwd(), 'src/main/windows')];
  });
};

function genIPCPreload(api: IApi) {
  fsExtra.copySync(
    path.join(__dirname, '../libs/ipc/main/ipc-preload.js'),
    path.join(
      api.env === 'development'
        ? path.join(
            api.paths.absTmpPath,
            './plugin-electron/build/preload/ipc-preload.js',
          )
        : path.join(api.paths.absOutputPath, './preload/ipc-preload.js'),
    ),
    { overwrite: true },
  );
}

async function getAllWindowIPCHandles(api: IApi) {
  return new IPCUtils(api).getAllHandles();
}
