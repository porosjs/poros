import { app } from 'electron';
import { PorosWindowManager, initialize } from 'poros';
import MainWindow from './windows/MainWindow';


export default class PorosApplication {
  async initialize() {
    initialize();

    await app.whenReady();

    PorosWindowManager.create(MainWindow);

    app.setAppUserModelId(app.name);

    this.registerEvent();
  }

  registerEvent() {
    app.on('before-quit', () => {
      app.exit(0);
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
