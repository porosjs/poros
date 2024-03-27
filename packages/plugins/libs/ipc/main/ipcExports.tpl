import { BrowserWindow, ipcMain, webContents } from 'electron';
import path from 'path';
import electronApi from '{{{electronLogPath}}}/src/main/electronApi';
import lodash from '{{{lodashPath}}}';
import PorosBrowserWindow from '../../plugin-electron/PorosBrowserWindow';
import PorosWindowManager from '../../plugin-electron/PorosWindowManager';
{{{rendererInvokers.import}}}

export function IpcHandle(
  target: PorosBrowserWindow,
  methodName: string,
  descriptor: PropertyDescriptor,
) {
  if (!(target instanceof PorosBrowserWindow)) {
    throw Error('Decorator `IpcHandle` cannot run in non-BrowserWindow class');
  }

  // 注册可执行Ipc方法
  target.ipcHandles = [...(target.ipcHandles ?? []), methodName];

  return descriptor;
}

export function initialize() {
  electronApi.setPreloadFileForSessions({
    filePath: path.join(__dirname, 'preload/ipc-preload.js'),
  });

  ipcMain.handle('__IPC_RENDER_MAIN_EXEC', (event, methodName: string, ...args: any[]) => {
    const bw = BrowserWindow.fromWebContents(event.sender);
    if (!bw) {
      throw Error('PorosBrowserWindow instance not found');
    }

    const isCurrentWindow = !methodName.includes('.');

    const id = bw.id;
    let instance: PorosBrowserWindow | Record<number, PorosBrowserWindow> | undefined;
    let [windowName, _methodName] = methodName.split('.');
    _methodName = _methodName ?? methodName;

    if (isCurrentWindow) {
      instance = PorosWindowManager.get(id);
    } else {
      if (/^\d+$/.test(windowName)) {
        // windowName实际为窗口id
        instance = PorosWindowManager.get(Number(windowName));
      } else {
        instance = PorosWindowManager.get(windowName);
      }
    }

    if (!instance) {
      throw Error(`${isCurrentWindow ? 'PorosBrowserWindow' : windowName} instance not found`);
    }

    const single = instance instanceof PorosBrowserWindow;

    const methodExist = single
      ? instance.ipcHandles?.includes(_methodName)
      : Object.values(instance)[0].ipcHandles?.includes(_methodName);

    if (!methodExist)
      throw Error(`${windowName ?? instance.constructor.name}.${_methodName} not a ipc method`);

    if (single) {
      const method = (instance as any)[_methodName] as (...arg: any[]) => any;
      return method.apply(instance, args);
    }

    // 多开
    return Promise.all(
      Object.values(instance as Record<number, PorosBrowserWindow>).map((_instance) => {
        const method = (_instance as any)[_methodName] as (...arg: any[]) => any;
        return method.apply(_instance, args);
      }),
    );
  });

  ipcMain.handle('__IPC_OPEN_WINDOW', (event, windowName: keyof typeof WINDOW_CLASS_MAP, ...args: any[]) => {
    const instance = PorosWindowManager.get(windowName);
    if(instance && instance instanceof PorosBrowserWindow){
      instance.show();
      return instance.id;
    }

    const WINDOW_CLASS_MAP = {
{{#windows}}
      '{{{className}}}': require('{{{importPath}}}').default,
{{/windows}}
    }
    return PorosWindowManager.create(WINDOW_CLASS_MAP[windowName], ...args).id;
  });
}

type Channel = keyof IpcChannelToHandlerMap;
type Handler<N extends Channel> = IpcChannelToHandlerMap[N];
type InvokerReturnType<T extends Channel> = Promise<
  Handler<T> extends (...args: any[]) => Promise<infer R> ? R : ReturnType<Handler<T>>
>;
type InvokerParameters<T extends Channel> = Parameters<Handler<T>>;

const electronInvoke = async <N extends Channel>(
  channel: string,
  broadcast = false,
  window?: PorosBrowserWindow,
  ...args: Parameters<Handler<N>>
) => {
  if (broadcast) {
    webContents.getAllWebContents().forEach((item) => {
      item.send(`__IPC_MAIN_RENDER_EXEC_${channel}`, undefined, ...args);
    });
    return;
  }

  if(!window) return;

  return new Promise<ReturnType<Handler<N>>>((resolve, reject) => {
    const id = lodash.uniqueId('ipc-');
    const listener = (_: any, { resolved, rejected }: any) => {
      if (rejected) {
        const error = new Error(rejected.message);
        error.name = rejected.name;
        error.stack = rejected.stack;
        reject(error);

        return;
      }

      resolve(resolved);
    };

    ipcMain.once(`__IPC_MAIN_RENDER_EXEC_${channel}@${id}`, listener);

    window.webContents.send(`__IPC_MAIN_RENDER_EXEC_${channel}`, id, ...args);
  });
};

const checkBrowserWindow = (obj: any) => {
  if (!(obj instanceof BrowserWindow)) {
    throw new Error(
      'When called outside of the PorosBrowserWindow, it is necessary to specify the window',
    );
  }
};
{{{rendererInvokers.content}}}