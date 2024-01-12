import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import { isDev, localShortcut, port } from 'poros';

export interface PorosBrowserWindowOptions extends BrowserWindowConstructorOptions {}

abstract class PorosBrowserWindow extends BrowserWindow {
  /**
   * 是否单例
   */
  static readonly single: boolean = true;

  constructor(url: string, { show = true, ...windowOptions }: PorosBrowserWindowOptions = {}) {
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

    const prefix = url.startsWith('/') ? '' : '/';
    const pageUrl = isDev
      ? `http://localhost:${port}/#${prefix}${url}`
      : `app://./index.html/#${prefix}${url}`;
    this.loadURL(pageUrl).then(() => {
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

  protected abstract registerWindowEvent(): void;
}

export default PorosBrowserWindow;
