import {
  IpcHandle,
  PorosBrowserWindow,
  PorosBrowserWindowOptions,
  PorosWindowManager,
  i18n,
} from 'poros';
import MainWindow from './MainWindow';

class AboutWindow extends PorosBrowserWindow {
  /**
   * 是否单例, 默认：true
   */
  static readonly single = false;

  /**
   * 加载页面地址
   */
  protected static readonly URL = '/about';

  /**
   * 窗口属性配置
   */
  protected static readonly OPTIONS: PorosBrowserWindowOptions = {
    title: i18n('title.about'),
    height: 234,
    width: 288,
    resizable: false,
    maximizable: false,
  };

  constructor() {
    super(AboutWindow.URL, AboutWindow.OPTIONS);
  }

  protected registerWindowEvent(): void {}

  show(): void {
    super.show();
    setTimeout(() => {
      this.foo2();
    }, 2000);
  }

  @IpcHandle
  foo(arg1: string, arg2: number) {
    console.log(
      `Executing TestWindow(#${this.id}).foo with arguments: ${arg1}, ${arg2}`,
    );
    return `Result for ${arg1}, ${arg2}`;
  }

  async foo2() {
    // await this.rendererInvoker.cpuMonitor(0.6, { broadcast: true });

    // const str = await this.rendererInvoker.cpuMonitor(0.3);
    await this.rendererInvoker.cpuMonitor(0.4, {
      window: PorosWindowManager.get(MainWindow),
    });
    // console.log(str);
  }
}

export default AboutWindow;
