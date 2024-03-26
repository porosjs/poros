'use strict';

try {
  const { contextBridge, ipcRenderer } = require('electron');

  contextBridge.exposeInMainWorld('__invokeIpc', (channel, ...args) =>
    ipcRenderer.invoke(channel, ...args),
  );

  contextBridge.exposeInMainWorld('__handleIpc', (channel, handler) => {
    const listener = async (_, id, ...args) => {
      try {
        const resolved = await handler(...args);

        ipcRenderer.send(`${channel}@${id}`, { resolved });
      } catch (error) {
        ipcRenderer.send(`${channel}@${id}`, {
          rejected: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        });
      }
    };

    ipcRenderer.on(channel, listener);

    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  });
} catch (e) {}
