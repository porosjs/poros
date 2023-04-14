import { dev } from '@porosjs/umi/dist/cli/dev';
import {
  checkLocal,
  checkVersion as checkNodeVersion,
} from '@porosjs/umi/dist/cli/node';
import { DEV_COMMAND } from '@porosjs/umi/dist/constants';
import { Service } from '@porosjs/umi/dist/service/service';
import { chalk, logger, yParser } from '@umijs/utils';

interface IOpts {
  presets?: string[];
  defaultConfigFiles?: string[];
}

export async function run(opts: IOpts = {}) {
  checkNodeVersion();
  checkLocal();

  const args = yParser(process.argv.slice(2), {
    alias: {
      version: ['v'],
      help: ['h'],
    },
    boolean: ['version'],
  });
  const command = args._[0];
  if ([DEV_COMMAND, 'setup'].includes(command)) {
    process.env.NODE_ENV = 'development';
  } else if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }
  opts.presets = opts?.presets
    ? opts?.presets.concat([require.resolve('./preset')])
    : [require.resolve('./preset')];

  if (opts?.presets) {
    process.env.UMI_PRESETS = opts.presets.join(',');
  }
  const version = require('../package.json').version;
  if (!opts.defaultConfigFiles && command === DEV_COMMAND) {
    logger.info(chalk.cyan.bold(`Poros v${version}`));
    dev();
  } else if (command === 'version' || command === 'v') {
    console.log(`poros@${version}`);
  } else {
    logger.info(chalk.cyan.bold(`Poros v${version}`));
    try {
      await new Service({
        defaultConfigFiles: opts.defaultConfigFiles || null,
      }).run2({
        name: args._[0],
        args,
      });
    } catch (e: any) {
      logger.error(e);
      process.exit(1);
    }
  }
}
