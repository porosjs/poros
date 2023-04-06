import { Menu, Tray, app, protocol } from 'electron';
import path from 'path';

import menu, { menuItems } from './menu';
import Server from './server/Server';
import { getResourcePath } from './utils/main/utils';
import WindowFactory from './windows/WindowFactory';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

export default class PorosApplication {
  private tray: Tray | null = null;

  private server: Server;
  private windowFactory: WindowFactory;

  constructor() {
    this.windowFactory = WindowFactory.getInstance();
    this.server = new Server();
  }

  callListenOnHttpServer() {
    return this.server.listen();
  }

  initTray() {
    this.tray = new Tray(path.join(getResourcePath(), './logo.ico'));

    this.tray.setContextMenu(menu);

    this.tray.addListener('click', () => {
      this.windowFactory.mainWindow?.show();
    });
  }

  initAppMenu() {
    const _menu = Menu.buildFromTemplate([
      {
        label: app.name,
        submenu: menuItems,
      },
      {
        role: 'editMenu',
      },
    ]);
    Menu.setApplicationMenu(_menu);
  }

  async initElectronAppObject() {
    Menu.setApplicationMenu(null);

    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    app.commandLine.appendSwitch(
      'webrtc-max-cpu-consumption-percentage',
      '100',
    );

    await app.whenReady();

    this.windowFactory.init();

    app.setAppUserModelId(app.name);

    app.on('before-quit', () => {
      app.exit(0);
    });

    app.on('second-instance', () => {
      this.windowFactory.mainWindow?.show();
    });

    app.addListener('activate', () => {
      this.windowFactory.mainWindow?.show();
    });
  }

  async start() {
    const isSingle = app.requestSingleInstanceLock();

    if (!isSingle) {
      app.exit();
    }

    await this.initElectronAppObject();
    this.callListenOnHttpServer();
  }
}

const pa = new PorosApplication();
pa.start();
