import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('__PRELOAD', 'I m defined in Preload!');
