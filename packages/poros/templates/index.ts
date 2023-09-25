import { ipcRenderer } from 'electron';

class LocalStore<Key extends keyof ElectronStoreSchema> {
  get(key: Key): ElectronStoreSchema[Key] {
    return ipcRenderer.sendSync('electron-store-get', key);
  }
  set(key: Key, val: ElectronStoreSchema[Key]): void {
    ipcRenderer.send('electron-store-set', key, val);
  }
}

const localStore = new LocalStore();

export { __electronLog as logger, localStore };
