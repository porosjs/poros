// @ts-nocheck
import { ipcMain } from 'electron'
import ElectronStore from '{{{electronStorePath}}}';
import ElectronExternalApi from '{{{electronLogPath}}}/src/main/ElectronExternalApi';
import path from 'path';

const electron = require('electron');
const externalApi = new ElectronExternalApi({ electron });

ElectronStore.prototype.initialize = function(){
  externalApi.setPreloadFileForSessions({ filePath: path.join(__dirname, 'preload/local-store-preload.js') });

  ipcMain.on('__IPC_ELECTRON_STORE_GET', async (event, val) => {
    event.returnValue = this.get(val);
  });
  ipcMain.on('__IPC_ELECTRON_STORE_SET', async (event, key, val) => {
    this.set(key, val);
  });
}

const store = new ElectronStore({{{electronStoreOptions}}});

export default store;
