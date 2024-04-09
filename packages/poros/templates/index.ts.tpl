// @ts-nocheck
import logger from '{{{electronLogPath}}}/renderer';
import { history } from 'poros';

console.log = logger.log;

const _logger = new Proxy(logger, {
  get: function(target, property) {
    const _target = target.scope('#' + history.location.pathname);

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
