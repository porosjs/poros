import { app, session as electronSession } from 'electron';
import type { Session } from 'electron';

export const isMacOS = process.platform === 'darwin';

export const isWindows = process.platform === 'win32';

export const isLinux = process.platform === 'linux';

export const isX86 = process.arch === 'ia32';

export const isX64 = process.arch === 'x64';

export const isDev = app ? !app.isPackaged : process.env.NODE_ENV === 'development';

export const isProd = !isDev;

export function setPreloadFileForSessions(id: string, filePath: string, includeFutureSession = true, getSessions = () => [electronSession?.defaultSession]) {
 for (const session of getSessions().filter(Boolean)) {
      setPreload(id, session);
    }

    if (includeFutureSession) {
      app.on('session-created', (session) => {
        setPreload(id, session);
      });
    }

    function setPreload(id: string, session:Session) {
      if (typeof session.registerPreloadScript === 'function') {
        session.registerPreloadScript({
          filePath,
          id,
          type: 'frame',
        });
      } else {
        session.setPreloads([...session.getPreloads(), filePath]);
      }
    }
}

