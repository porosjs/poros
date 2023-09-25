import logger from '{{{electronLogPath}}}';
import merge from '{{{lodashMergePath}}}'

logger.initialize({ spyRendererConsole: true });

{{#loggerOptions}}
merge(logger, {{{loggerOptions}}})
{{/loggerOptions}}

export default logger;
