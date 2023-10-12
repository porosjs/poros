import { i18n, initialize, logger } from 'poros';
import { BrowserWindow, Tray, app } from 'electron';
import path from 'path';


export default class PorosApplication {
  private tray: Tray | null = null;

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
    this.mainWindow.loadURL('http://localhost:8000');
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

    initialize()

    await this.initElectronAppObject();
  }
}

const pa = new PorosApplication();
pa.start();
