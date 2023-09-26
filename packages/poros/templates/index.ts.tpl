// @ts-nocheck
import { ipcRenderer } from 'electron';
import logger from '{{{electronLogPath}}}/renderer';

class LocalStore {
  get(key: string): any {
    return ipcRenderer.sendSync('__IPC_ELECTRON_STORE_GET', key);
  }
  set(key: string, val: any): void {
    ipcRenderer.send('__IPC_ELECTRON_STORE_SET', key, val);
  }
}

const localStore = new LocalStore();

export { logger, localStore };
