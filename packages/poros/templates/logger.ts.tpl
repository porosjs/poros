// @ts-nocheck
import logger from '{{{electronLogPath}}}';

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

export default logger;
