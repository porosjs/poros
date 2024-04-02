// @ts-nocheck
import logger from '{{{electronLogPath}}}/renderer';
import { history } from 'poros';

const _logger = new Proxy(logger, {
  get: function(target, property) {
    const _target = target.scope('#' + history.location.pathname);

    if (process.env.NODE_ENV==='development' && ['warn', 'debug', 'error'].includes(property)) {
      return function(...params: any[]) {
        const [first, ...rest] = params;
        _target[property](`---${property}---${first}`, ...rest);
      };
    }

    return _target[property];
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
