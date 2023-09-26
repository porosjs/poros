// @ts-nocheck
import { ipcMain } from 'electron'
import ElectronStore from '{{{electronStorePath}}}';

ElectronStore.prototype.initialize = function(){
  ipcMain.on('__IPC_ELECTRON_STORE_GET', async (event, val) => {
    event.returnValue = this.get(val);
  });
  ipcMain.on('__IPC_ELECTRON_STORE_SET', async (event, key, val) => {
    this.set(key, val);
  });
}

const store = new ElectronStore({{{electronStoreOptions}}});

export default store;
