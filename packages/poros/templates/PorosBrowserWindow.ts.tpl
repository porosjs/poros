import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import { isDev, localShortcut, port, rendererInvoker} from 'poros';

export interface PorosBrowserWindowOptions extends BrowserWindowConstructorOptions {
  hideOnClose?: boolean
}

abstract class PorosBrowserWindow extends BrowserWindow {
  /**
   * 是否单例
   */
  static readonly single: boolean = true;

  rendererInvoker = { ...rendererInvoker };

  constructor(url: string, { show = true, hideOnClose, ...windowOptions }: PorosBrowserWindowOptions = {}) {
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

    if(hideOnClose){
      this.on('close', (e) => {
        e.preventDefault();
        this.hide();
      });
    }

    this.registerWindowEvent();
    this.registerDevtoolsShortcut();

    Object.keys(rendererInvoker).forEach((key) => {
      // @ts-ignore
      this.rendererInvoker[key] = this.rendererInvoker[key].bind(this);
    })
  }

  show() {
    super.show();
    this.webContents.focus();
  }

  private registerDevtoolsShortcut() {
    if (!this.isDestroyed()) {
      const wcs = this.webContents;
      if (isDev) {
        localShortcut.register(this, ['CmdOrCtrl+Option+I', 'F12'], () => {
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
