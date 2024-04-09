// @ts-nocheck
import logger from '{{{electronLogPath}}}/main';
import { isWindows } from './utils';

console.log = logger.log;

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
const separator = isWindows ? '>' : '›';
logger.transports.console.format = ({
  message: { level, data, date, scope, variables },
}) =>
  data.map(
    (content, index) =>
      index === 0 ? `---${level}---[${variables.processType === 'renderer' ? 'Renderer' : 'Main'}] ${date.getHours().toString(10).padStart(2, '0')}:${date.getMinutes().toString(10).padStart(2, '0')}:${date.getSeconds().toString(10).padStart(2, '0')}.${date.getMilliseconds().toString(10)}${scope?` (${scope})`:''} ${separator} ${content}` : content,
  );

export default logger;
