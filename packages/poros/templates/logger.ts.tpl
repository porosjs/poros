import logger from '{{{electronLogPath}}}';
import merge from '{{{lodashMergePath}}}'

logger.initialize();

{{#loggerOptions}}
merge(logger, {{{loggerOptions}}})
{{/loggerOptions}}

export default logger;
