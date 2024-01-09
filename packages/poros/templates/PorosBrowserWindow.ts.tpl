import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import { isDev, localShortcut } from 'poros';

export interface WindowOptions extends BrowserWindowConstructorOptions {}

abstract class PorosBrowserWindow extends BrowserWindow {
  /**
   * 支持窗口多开
   */
  static readonly multiple: boolean = false;

  isFinishLoad = false;

  constructor(url: string, { show = true, ...windowOptions }: WindowOptions = {}) {
    const options = {
      show: false,
      ...windowOptions,
      webPreferences: {
        webSecurity: false,
        spellcheck: false,
        contextIsolation: true,
        ...(windowOptions.webPreferences ?? {}),
      },
    };

    super(options);

    if (isDev) {
      this.loadURL(`http://localhost:${port}/#/${url}`);
    } else {
      this.loadURL(`app://./index.html/#/${url}`);
    }

    this.webContents.on('did-finish-load', () => {
      this.isFinishLoad = true;
      if (show) {
        this.show();
      }
    });

    this.registerWindowEvent();
    this.registerDevtoolsShortcut();
  }

  show() {
    super.show();
    this.webContents.focus();
  }

  private registerDevtoolsShortcut() {
    if (!this.isDestroyed()) {
      const wcs = this.webContents;
      if (isDev) {
        localShortcut.register(this, ['Cmd+Option+I', 'F12'], () => {
          if (wcs.isDevToolsOpened()) {
            wcs.devToolsWebContents?.focus();
          } else {
            wcs.openDevTools({ mode: 'detach', activate: true });
          }
        });
      }
    }
  }

  abstract registerWindowEvent(): void;
}

export default PorosBrowserWindow;
