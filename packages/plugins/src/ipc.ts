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
    const util = new IPCUtils(api);

    const windows = util.getAllWindows();
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
        windows,
      }),
    });

    const invokers = util.getAllInvokers();

    api.writeTmpFile({
      path: 'renderer/ipcExports.ts',
      content: `
${invokers.import}

${invokers.content}

export const useIPCHandle = (channel: string, handle: (...args: any[]) => any): void => {
  useEffect(() => {
    const removeHandle = __handleIPC(\`__IPC_MAIN_RENDER_EXEC_\${channel}\`, (...args: any[]) => handle(...args));
    return () => removeHandle();
  }, []);
};
      `,
    });

    api.writeTmpFile({
      path: 'index.ts',
      content: `
export { mainInvoker } from './renderer/ipcExports';
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
