// @ts-nocheck
import { ipcMain } from 'electron'
import ElectronStore from '{{{electronStorePath}}}';
import electronApi from '{{{electronLogPath}}}/src/main/electronApi';
import path from 'path';

ElectronStore.prototype.initialize = function(){
  electronApi.setPreloadFileForSessions({ filePath: path.join(__dirname, 'preload/local-store-preload.js') });

  ipcMain.on('__Ipc_ELECTRON_STORE_GET', async (event, val) => {
    event.returnValue = this.get(val);
  });
  ipcMain.on('__Ipc_ELECTRON_STORE_SET', async (event, key, val) => {
    this.set(key, val);
  });
}

const store = new ElectronStore({{{electronStoreOptions}}});

export default store;
