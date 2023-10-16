import { BrowserWindow, app } from 'electron';
import path from 'path';
import { i18n, initialize, isDev, logger, port } from 'poros';

export default class PorosApplication {
  mainWindow?: BrowserWindow;

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        contextIsolation: true,
        preload: path.join(__dirname, 'preload/index.js'),
      },
    });
    if (isDev) {
      this.mainWindow.loadURL(`http://localhost:${port}/#/home`);
    } else {
      this.mainWindow.loadURL('app://./index.html/#/home');
    }
  }

  async initElectronAppObject() {
    await app.whenReady();

    this.createWindow();

    app.setAppUserModelId(app.name);

    logger.info(i18n('hello.poros'));

    app.on('before-quit', () => {
      app.exit(0);
    });

    app.on('second-instance', () => {});

    app.addListener('activate', () => {});
  }

  async start() {
    const isSingle = app.requestSingleInstanceLock();

    if (!isSingle) {
      app.exit();
    }

    initialize();

    await this.initElectronAppObject();
  }
}

const pa = new PorosApplication();
pa.start();
