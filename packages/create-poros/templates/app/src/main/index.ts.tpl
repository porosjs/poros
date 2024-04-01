import { app } from 'electron';
import {
  PorosWindowManager,
  initialize,
  isDev,
  isMacOS,
  isWindows,
} from 'poros';
import MainWindow from './windows/MainWindow.ts.tpl';

export default class PorosApplication {
  async initialize() {
    initialize();

    await app.whenReady();

    PorosWindowManager.create(MainWindow);

    app.setAppUserModelId(app.name);

    this.registerEvent();
  }

  registerEvent() {
    if (isDev) {
      if (isWindows) {
        process.on('message', (data) => {
          if (data === 'graceful-exit') {
            app.quit();
          }
        });
      } else {
        process.on('SIGTERM', () => {
          app.quit();
        });
      }
    }

    app.on('window-all-closed', () => {
      if (!isMacOS) {
        app.quit();
      }
    });

    app.on('activate', () => {
      PorosWindowManager.get(MainWindow)?.show();
    });
  }

  async start() {
    const isSingle = app.requestSingleInstanceLock();

    if (!isSingle) {
      app.exit();
    }

    await this.initialize();
  }
}

const pa = new PorosApplication();
pa.start();
