import { app } from 'electron';

export const isMacOS = process.platform === 'darwin';

export const isWindows = process.platform === 'win32';

export const isLinux = process.platform === 'linux';

export const isX86 = process.arch === 'ia32';

export const isX64 = process.arch === 'x64';

const isEnvSet = 'ELECTRON_IS_DEV' in process.env;
const getFromEnv = Number.parseInt(process.env.ELECTRON_IS_DEV!, 10) === 1;

export const isDev = isEnvSet ? getFromEnv : !app.isPackaged;

export const isProd = !isDev;
