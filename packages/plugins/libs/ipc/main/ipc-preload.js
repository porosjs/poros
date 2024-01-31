// @ts-nocheck
'use strict';

try {
  const { contextBridge, ipcRenderer } = require('electron');

  contextBridge.exposeInMainWorld('__invokeIPC', (methodName, ...args) =>
    ipcRenderer.invoke('__IPC_RENDER_MAIN_EXEC', methodName, ...args),
  );
} catch (e) {}
