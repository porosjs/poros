// @ts-nocheck
'use strict';

try {
  const { contextBridge, ipcRenderer } = require('electron');

  contextBridge.exposeInMainWorld('__invokeIPC', (channel, ...args) =>
    ipcRenderer.invoke(channel, ...args),
  );
} catch (e) {}
