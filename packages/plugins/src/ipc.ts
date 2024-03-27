import { IApi } from '@porosjs/umi';
import { Mustache, fsExtra, winPath } from '@umijs/utils';
import { readFileSync } from '@umijs/utils/compiled/fs-extra';
import fs from 'fs';
import path from 'path';
import { IpcUtils } from './utils/ipcUtils';

export default (api: IApi) => {
  api.describe({
    key: 'ipc',
    enableBy: api.EnableBy.register,
  });

  api.onGenerateFiles(async () => {
    const hasIpcFile = ['ts', 'tsx'].some((ext) => fs.existsSync(path.join(api.paths.absSrcPath, `ipc.${ext}`)));

    const util = new IpcUtils(api, hasIpcFile);

    const rendererInvokers = util.getRendererInvokers();
    const windows = util.getAllWindows();
    const mainExportsTpl = readFileSync(path.join(__dirname, '../libs/ipc/main/ipcExports.tpl'), 'utf-8');
    api.writeTmpFile({
      path: 'main/ipcExports.ts',
      content: Mustache.render(mainExportsTpl, {
        electronLogPath: winPath(path.dirname(require.resolve('electron-log/package.json'))),
        lodashPath: winPath(path.dirname(require.resolve('lodash/package.json'))),
        windows,
        rendererInvokers,
      }),
    });

    const mainInvokers = util.getMainInvokers();

    api.writeTmpFile({
      path: 'renderer/ipcExports.ts',
      content: `
import { useEffect, useState } from 'react';
${hasIpcFile ? `import type IpcChannelToHandlerMap from '@/renderer/ipc';` : ''}
${mainInvokers.import}

${mainInvokers.content}

${
  hasIpcFile
    ? `
type IpcChannel = keyof IpcChannelToHandlerMap;
type IpcHandler<N extends IpcChannel> = IpcChannelToHandlerMap[N];

export function useIpc<N extends IpcChannel>(channel: N, handler?: (...args: Parameters<IpcHandler<N>>) => (ReturnType<IpcHandler<N>> | Promise<ReturnType<IpcHandler<N>>>)): Parameters<IpcHandler<N>> {
  const [state, setState] = useState<Parameters<IpcHandler<N>>>([]);

  useEffect(() => {
    const removeHandle = __handleIpc(\`__IPC_MAIN_RENDER_EXEC_\${channel}\`, async (...args: Parameters<IpcHandler<N>>) => {
      setState(args);
      return await handler?.(...args);
    });
    return () => removeHandle();
  }, [channel]);

  return state;
};`
    : ''
}
      `,
    });

    api.writeTmpFile({
      path: 'index.ts',
      content: `
export { mainInvoker${hasIpcFile ? `, useIpc` : ''} } from './renderer/ipcExports';
`,
    });
  });

  api.onBeforeCompiler(() => {
    genIpcPreload(api);
  });
  api.onBuildComplete(() => {
    genIpcPreload(api);
  });

  api.addTmpGenerateWatcherPaths(() => {
    return [path.join(process.cwd(), 'src/main/windows'), path.join(process.cwd(), 'src/renderer/ipc.ts'), path.join(process.cwd(), 'src/renderer/ipc.tsx')];
  });
};

function genIpcPreload(api: IApi) {
  fsExtra.copySync(
    path.join(__dirname, '../libs/ipc/main/ipc-preload.js'),
    path.join(api.env === 'development' ? path.join(api.paths.absTmpPath, './plugin-electron/build/preload/ipc-preload.js') : path.join(api.paths.absOutputPath, './preload/ipc-preload.js')),
    { overwrite: true },
  );
}
