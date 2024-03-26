// @ts-nocheck
'use strict';

try {
  const { contextBridge, ipcRenderer } = require('electron');
  contextBridge.exposeInMainWorld('__changeLang', (lang) =>
    ipcRenderer.send('__Ipc_LANG_CHANGE', lang),
  );
} catch (e) {}
