import { logger } from 'poros';
import PorosBrowserWindow from './PorosBrowserWindow';

interface Type<T = any> extends Function {
  new (...args: any[]): T;
  multiple: boolean;
}

class PorosWindowManager {
  private static instanceMap: Map<string, PorosBrowserWindow | PorosBrowserWindow[]> = new Map();

  static create(
    clazz: Type<PorosBrowserWindow>,
    properties?: PropertyDescriptorMap & ThisType<any>,
  ) {
    const isMultiple = this.canMultiple(clazz);
    const isExist = this.instanceMap.has(clazz.name);

    if (!isMultiple && isExist) {
      logger.warn(`${clazz.name} is exist, duplication is not allowed`);
      return;
    }

    let instance: PorosBrowserWindow;

    if (properties) instance = Object.create(clazz, properties);
    else instance = Object.create(clazz);

    console.log('============', clazz, instance)

    if (isMultiple) {
      const instances = (this.instanceMap.get(clazz.name) as PorosBrowserWindow[]) ?? [];
      instances.push(instance);
    } else {
      this.instanceMap.set(clazz.name, instance);
    }

    return instance;
  }

  static destroy(clazz: Type<PorosBrowserWindow>) {
    const instance = this.get(clazz);

    this.instanceMap.delete(clazz.name);

    if (Array.isArray(instance)) {
      instance.forEach((item) => {
        item.destroy();
      });
    } else {
      if (instance?.isDestroyed()) {
        logger.warn(`${clazz.name} is destroyed`);
        return;
      }

      instance?.destroy();
    }
  }

  static destroyAll(excludes: Type<PorosBrowserWindow>[]) {
    const excludeNames = excludes.map((item) => item.name);

    const newInstanceMap = new Map<string, PorosBrowserWindow | PorosBrowserWindow[]>();

    this.instanceMap.forEach((value, key) => {
      if (!excludeNames.includes(key)) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            item.destroy();
          });
        } else {
          value.destroy();
        }
      } else {
        newInstanceMap.set(key, value);
      }
    });

    this.instanceMap = newInstanceMap;
  }

  static get<T extends Type<PorosBrowserWindow>>(
    clazz: T,
  ): (T['multiple'] extends true ? PorosBrowserWindow[] : PorosBrowserWindow) | undefined {
    const instance = this.instanceMap.get(clazz.name);

    if (!instance) {
      logger.warn(`${clazz.name} not exist`);
    }

    return instance as any;
  }

  private static canMultiple(clazz: Type<PorosBrowserWindow>) {
    return clazz.multiple;
  }
}

export default PorosWindowManager;
