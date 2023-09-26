import logger from '{{{electronLogPath}}}/main';
{{#electronLogOptions}}
import merge from '{{{lodashMergePath}}}'

merge(logger, {{{electronLogOptions}}})
{{/electronLogOptions}}

export default logger;
