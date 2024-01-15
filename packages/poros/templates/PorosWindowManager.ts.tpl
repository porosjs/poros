import { logger } from 'poros';
import PorosBrowserWindow from './PorosBrowserWindow';

interface Type<T = any> extends Function {
  new (...args: any[]): T;
  single: boolean;
}

class PorosWindowManager {
  private static instanceNameMap: Map<
    string,
    PorosBrowserWindow | Record<number, PorosBrowserWindow>
  > = new Map();
  private static instanceIdMap: Map<number, PorosBrowserWindow> = new Map();

  static create(
    constructor: Type<PorosBrowserWindow>,
    ...properties: ConstructorParameters<typeof constructor>
  ) {
    const isMultiple = this.canMultiple(constructor);
    const isExist = this.instanceNameMap.has(constructor.name);

    if (!isMultiple && isExist) {
      logger.warn(`${constructor.name} is exist, duplication is not allowed`);
      return;
    }

    let instance: PorosBrowserWindow = new constructor(...properties);

    instance.on('closed', () => {
      this.instanceIdMap.delete(instance.id);

      if (constructor.single) {
        // 单开窗口
        this.instanceNameMap.delete(constructor.name);
      } else {
        // 多开窗口
        const instances = this.getByConstructor(constructor) as Record<number, PorosBrowserWindow>;
        delete instances[instance.id];
        if (!Object.keys(instances).length) {
          this.instanceNameMap.delete(constructor.name);
        }
      }
    });

    if (isMultiple) {
      const instances =
        (this.instanceNameMap.get(constructor.name) as Record<number, PorosBrowserWindow>) ?? {};
      instances[instance.id] = instance;
      this.instanceNameMap.set(constructor.name, instances);
    } else {
      this.instanceNameMap.set(constructor.name, instance);
    }

    this.instanceIdMap.set(instance.id, instance);

    return instance;
  }

  static destroy(id: number): void;
  static destroy(constructor: Type<PorosBrowserWindow>): void;
  static destroy(param: Type<PorosBrowserWindow> | number): void {
    if (typeof param === 'number') {
      this.destroyById(param);
      return;
    }

    this.destroyByConstructor(param);
  }

  static destroyAll(excludes: Type<PorosBrowserWindow>[] = []) {
    const excludeNames = excludes.map((item) => item.name);

    const deleteList: string[] = [];
    this.instanceNameMap.forEach((instance, key) => {
      if (!excludeNames.includes(key)) {
        deleteList.push(key);

        if (instance instanceof PorosBrowserWindow) {
          // 单开窗口
          (instance as PorosBrowserWindow).destroy();
        } else {
          // 多开窗口
          Object.values(instance as Record<number, PorosBrowserWindow>).forEach((item) =>
            item.destroy(),
          );
        }
      }
    });

    if (deleteList.length === this.instanceNameMap.size) this.instanceNameMap.clear();
    else deleteList.forEach((item) => this.instanceNameMap.delete(item));
  }

  static get<T extends Type<PorosBrowserWindow>>(
    constructor: T,
  ):
    | (T['single'] extends false ? Record<number, PorosBrowserWindow> : PorosBrowserWindow)
    | undefined;
  static get(id: number): PorosBrowserWindow | undefined;
  static get(name: string): Record<number, PorosBrowserWindow> | PorosBrowserWindow;
  static get(
    param: Type<PorosBrowserWindow> | number | string,
  ): Record<number, PorosBrowserWindow> | PorosBrowserWindow | undefined {
    if (typeof param === 'number') {
      return this.getById(param);
    }

    if (typeof param === 'string') {
      return this.instanceNameMap.get(param);
    }

    return this.getByConstructor(param);
  }

  private static getByConstructor(constructor: Type<PorosBrowserWindow>) {
    const instance = this.instanceNameMap.get(constructor.name);

    if (!instance) {
      logger.warn(`${constructor.name} not exist`);
      return undefined;
    }

    return instance;
  }

  private static getById(id: number) {
    const instance = this.instanceIdMap.get(id);

    if (!instance) {
      logger.warn(`BrowserWindow[#${id}] not exist`);
      return undefined;
    }

    return instance;
  }

  private static destroyByConstructor(constructor: Type<PorosBrowserWindow>) {
    const instance = this.getByConstructor(constructor);

    if (!instance) {
      logger.warn(`${constructor.name} not exist`);
      return undefined;
    }

    if (constructor.single) {
      // 单开窗口
      const _instance = instance as PorosBrowserWindow;
      _instance.destroy();
      this.instanceIdMap.delete(_instance.id);
    } else {
      // 多开窗口
      const _instance = instance as Record<number, PorosBrowserWindow>;
      Object.values(_instance).forEach((item) => {
        item.destroy();
        this.instanceIdMap.delete(item.id);
      });
    }

    this.instanceNameMap.delete(constructor.name);
  }

  private static destroyById(id: number) {
    const instance = this.getById(id);

    if (!instance) {
      logger.warn(`BrowserWindow[#${id}] not exist`);
      return undefined;
    }

    instance.destroy();

    this.instanceIdMap.delete(id);
    this.instanceNameMap.delete(instance.constructor.name);
  }

  private static canMultiple(constructor: Type<PorosBrowserWindow>) {
    return !constructor.single;
  }
}

export default PorosWindowManager;
