import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import electronApi from '{{{electronLogPath}}}/src/main/electronApi';
import PorosBrowserWindow from '../../plugin-electron/PorosBrowserWindow';
import PorosWindowManager from '../../plugin-electron/PorosWindowManager';

export function IPCHandle(
  target: PorosBrowserWindow,
  methodName: string,
  descriptor: PropertyDescriptor,
) {
  if (!(target instanceof PorosBrowserWindow)) {
    throw Error('Decorator `IPCHandle` cannot run in non-BrowserWindow class');
  }

  // 注册可执行IPC方法
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
