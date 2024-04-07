import { app, shell } from 'electron';
import path from 'path';
import {
  IpcHandle,
  PorosBrowserWindow,
  PorosBrowserWindowOptions,
  isWindows,
  logger,
} from 'poros';
import si from 'systeminformation';

class MainWindow extends PorosBrowserWindow {
  /**
   * 是否单例, 默认：true
   */
  static readonly single = true;

  /**
   * 加载页面地址
   */
  protected static readonly URL = '/';

  /**
   * 窗口属性配置
   */
  protected static readonly OPTIONS: PorosBrowserWindowOptions = {
    title: 'Poros',
    height: 630,
    width: 542,
    minHeight: 630,
    minWidth: 542,
    hideOnClose: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload/index.js'),
    },
  };

  private monitorTimer?: NodeJS.Timer;

  constructor() {
    super(MainWindow.URL, MainWindow.OPTIONS);

    logger.warn('MainWindow Init');

    this.startNetworkMonitor();
  }

  protected registerWindowEvent(): void {
    this.on('closed', () => {
      this.stopNetworkMonitor();
    });
  }

  private async startNetworkMonitor() {
    const iface = await si.networkInterfaceDefault();

    this.monitorTimer = setInterval(() => {
      si.networkStats(iface).then(([{ rx_sec, tx_sec }]) => {
        this.rendererInvoker.networkMonitor(rx_sec / 1024, tx_sec / 1024);
      });
    }, 1000);
  }

  private stopNetworkMonitor() {
    clearInterval(this.monitorTimer);
  }

  @IpcHandle
  openExternal(url: string) {
    shell.openExternal(url);
  }

  @IpcHandle
  async getVersions() {
    const { codename, distro } = await si.osInfo();

    return {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
      os: isWindows ? distro : codename,
    };
  }

  @IpcHandle
  openDevTools() {
    if (this.webContents.isDevToolsOpened()) {
      this.webContents.devToolsWebContents?.focus();
    } else {
      this.webContents.openDevTools({ mode: 'detach', activate: true });
    }
  }

  @IpcHandle
  openLogDir() {
    const logPath = app.getPath('logs');
    shell.openPath(logPath);
  }
}

export default MainWindow;
