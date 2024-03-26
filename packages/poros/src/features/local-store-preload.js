// @ts-nocheck
'use strict';

try {
  const { contextBridge, ipcRenderer } = require('electron');
  contextBridge.exposeInMainWorld('__localStore', {
    get(key) {
      return ipcRenderer.sendSync('__Ipc_ELECTRON_STORE_GET', key);
    },
    set(key, val) {
      ipcRenderer.send('__Ipc_ELECTRON_STORE_SET', key, val);
    },
  });
} catch (e) {}
