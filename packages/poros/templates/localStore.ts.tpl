// @ts-nocheck
import { ipcMain } from 'electron'
import ElectronStore from '{{{electronStorePath}}}';
import path from 'path';
import { setPreloadFileForSessions } from './utils';

ElectronStore.prototype.initialize = function(){
  setPreloadFileForSessions('local-store-preload', path.join(__dirname, 'preload/local-store-preload.js'));

  ipcMain.on('__IPC_ELECTRON_STORE_GET', async (event, val) => {
    event.returnValue = this.get(val);
  });
  ipcMain.on('__IPC_ELECTRON_STORE_SET', async (event, key, val) => {
    this.set(key, val);
  });
}

const store = new ElectronStore({{{electronStoreOptions}}});

export default store;
