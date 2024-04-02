// @ts-nocheck
import logger from '{{{electronLogPath}}}/main';
import { isDev } from './utils';

{{#electronLogOptions}}
function setProps(obj: any, logObj: any) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        setProps(obj[key], logObj[key]);
      } else {
        logObj[key] = obj[key];
      }
    }
  }
}

const options = {{{electronLogOptions}}};
setProps(options, logger);
{{/electronLogOptions}}

const _logger = new Proxy(logger, {
  get: function(target, property) {
     if (isDev && ['warn', 'debug', 'error'].includes(property)) {
      return function(...params: any[]) {
        const [first, ...rest] = params;
        target[property](`---${property}---${first}`, ...rest);
      };
    }
    return target[property];
  }
});

export default _logger;
