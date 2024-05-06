import { app } from 'electron';

export const isMacOS = process.platform === 'darwin';

export const isWindows = process.platform === 'win32';

export const isLinux = process.platform === 'linux';

export const isX86 = process.arch === 'ia32';

export const isX64 = process.arch === 'x64';

export const isDev = app ? !app.isPackaged : process.env.NODE_ENV === 'development';

export const isProd = !isDev;
