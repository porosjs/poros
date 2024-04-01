import { PorosBrowserWindow, PorosBrowserWindowOptions, i18n } from 'poros';
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
}

export default AboutWindow;
