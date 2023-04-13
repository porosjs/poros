import createProtocol from '@@/plugin-electron/createProtocol';
import { BrowserWindow, Tray, app, protocol } from 'electron';
import path from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

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
    if (isDevelopment) {
      this.mainWindow.loadURL(`http://localhost:${process.env.PORT ?? 8000}`);
    } else {
      createProtocol('app');
      this.mainWindow.loadURL('app://./index.html');
    }
  }

  async initElectronAppObject() {
    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    app.commandLine.appendSwitch(
      'webrtc-max-cpu-consumption-percentage',
      '100',
    );

    await app.whenReady();

    this.createWindow();

    app.setAppUserModelId(app.name);

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

    await this.initElectronAppObject();
  }
}

const pa = new PorosApplication();
pa.start();
