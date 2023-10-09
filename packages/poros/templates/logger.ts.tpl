import logger from '{{{electronLogPath}}}';
{{#electronLogOptions}}
import merge from '{{{lodashMergePath}}}'

merge(logger, {{{electronLogOptions}}})
{{/electronLogOptions}}

export default logger;
