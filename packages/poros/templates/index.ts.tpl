// @ts-nocheck
import logger from '{{{electronLogPath}}}/renderer';
import { history } from 'poros';

Object.assign(console, logger.functions);

const _logger = new Proxy(logger, {
  get: function(target, property) {
    if(history?.location?.pathname) {
      const _target = target.scope('#' + history.location.pathname);
      return _target[property];
    }

    return target[property];
  }
});

class LocalStore {
  get(key: string): any {
    return __localStore.get(key);
  }
  set(key: string, val: any): void {
    __localStore.set(key, val);
  }
}

const localStore = new LocalStore();

export { _logger as logger, localStore };
