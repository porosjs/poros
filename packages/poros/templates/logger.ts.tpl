import logger from '{{{electronLogPath}}}';

// 日志文件等级，默认值：false
logger.transports.file.level = 'warn';
// 日志控制台等级，默认值：false
logger.transports.console.level = 'debug';
// 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}
logger.transports.file.format =
  '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
// 日志大小，默认：1048576（1M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
logger.transports.file.maxSize = 1048576;

export default logger;
