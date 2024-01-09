import { BrowserWindow } from 'electron';
import localShortcut from '{{{electronLocalShortcutStorePath}}}';

/**
 * Disable all of the shortcuts registered on the BrowserWindow instance.
 * Registered shortcuts no more works on the `window` instance, but the module
 * keep a reference on them. You can reactivate them later by calling `enableAll`
 * method on the same window instance.
 */
export function disableAll(win: BrowserWindow) {
  localShortcut.disableAll(win);
}

/**
 * Enable all of the shortcuts registered on the BrowserWindow instance that
 * you had previously disabled calling `disableAll` method.
 */
export function enableAll(win: BrowserWindow) {
  localShortcut.enableAll(win);
}

/**
 * Returns `true` or `false` depending on whether the shortcut `accelerator`
 * is registered on `window`.
 * @param win BrowserWindow instance to check. This argument
 * could be omitted, in this case the function returns whether the shortcut
 * `accelerator` is registered on all app windows. If you registered the
 * shortcut on a particular window instance, it returns false.
 * @param accelerator the shortcut to check
 * @return if the shortcut `accelerator` is registered on `window`.
 */
export function isRegistered(win: BrowserWindow, accelerator: string): boolean;
export function isRegistered(accelerator: string): boolean;
export function isRegistered(...args: any[]): boolean {
  return localShortcut.isRegistered(...args);
}

/**
 * Registers the shortcut `accelerator`on the BrowserWindow instance.
 *
 * @param win BrowserWindow instance to register.
 * This argument could be omitted, in this case the function register
 * the shortcut on all app windows.
 * @param accelerator the shortcut to register
 * @param callback This function is called when the shortcut is pressed
 * and the window is focused and not minimized.
 */
export function register(
  win: BrowserWindow,
  accelerator: string | string[],
  callback: () => void,
): void;
export function register(
  accelerator: string | string[],
  callback: () => void,
): void;
export function register(...args: any[]) {
  localShortcut.register(...args);
}

/**
 * Unregisters the shortcut of `accelerator` registered on the BrowserWindow instance.
 *
 * @param win BrowserWindow instance to unregister.
 * This argument could be omitted, in this case the function unregister the shortcut
 * on all app windows. If you registered the shortcut on a particular window instance, it will do nothing.
 * @param accelerator the shortcut to unregister
 */
export function unregister(
  win: BrowserWindow,
  accelerator: string | string[],
): void;
export function unregister(accelerator: string | string[]): void;
export function unregister(...args: any[]) {
  localShortcut.register(...args);
}

/**
 * Unregisters all of the shortcuts registered on any focused BrowserWindow
 * instance. This method does not unregister any shortcut you registered on
 * a particular window instance.
 * @param win BrowserWindow instance
 */
export function unregisterAll(win: BrowserWindow) {
  localShortcut.unregisterAll(win);
}
