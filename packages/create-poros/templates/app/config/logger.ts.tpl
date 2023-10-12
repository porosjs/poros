
// https://github.com/megahertz/electron-log
export default {
  transports: {
    file: {
      // 日志文件等级，默认值：false
      level: 'warn',
      // 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}
      format: '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}',
      // 日志大小，默认：1048576（1M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
      maxSize: 1048576
    },
    console: {
      // 日志文件等级，默认值：false
      level: 'debug'
    }
  }
};

