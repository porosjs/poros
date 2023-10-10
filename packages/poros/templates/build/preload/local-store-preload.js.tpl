// @ts-nocheck
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__localStore', {
  get(key) {
    return ipcRenderer.sendSync('__IPC_ELECTRON_STORE_GET', key);
  },
  set(key, val) {
    ipcRenderer.send('__IPC_ELECTRON_STORE_SET', key, val);
  },
});
