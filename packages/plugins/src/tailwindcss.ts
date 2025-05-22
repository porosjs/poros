import { existsSync } from 'fs';
import { dirname, join } from 'path';
import type { IApi } from 'umi';
import { crossSpawn, semver, winPath } from 'umi/plugin-utils';

const CHECK_INTERVAL = 300;

function getTailwindBinPath(opts: { cwd: string }) {
  const pkgPath = require.resolve('@tailwindcss/cli/package.json', {
    paths: [opts.cwd],
  });
  const tailwindPath = require(pkgPath).bin['tailwindcss'];
  return join(dirname(pkgPath), tailwindPath);
}

export default (api: IApi) => {
  api.describe({
    key: 'tailwindcss',
    config: {
      schema({ zod }) {
        return zod
          .object({
            timeout: zod.number(),
          })
          .partial();
      },
    },
    enableBy: api.EnableBy.register,
  });

  try {
    const pkgPath = dirname(require.resolve('tailwindcss/package.json'));
    const tailwindVersion = require(`${pkgPath}/package.json`).version;

    if (semver.lt(tailwindVersion, '4.0.0')) {
      throw new Error(`Tailwindcss version ${tailwindVersion} is not supported, please upgrade to 4.0.0 or above`);
    }
  } catch (error) {
    throw new Error(`Can't find tailwindcss package. Please install tailwindcss first.`);
  }

  let tailwind: any = null;
  const outputPath = 'plugin-tailwindcss/tailwind.css';

  api.onBeforeCompiler(() => {
    const inputPath = join(api.paths.absSrcPath, 'tailwind.css');
    const generatedPath = join(api.paths.absTmpPath, outputPath);
    const binPath = getTailwindBinPath({ cwd: api.cwd });

    if (process.env.IS_UMI_BUILD_WORKER) {
      return;
    }

    return new Promise<void>((resolve) => {
      /** 透过子进程建立 tailwindcss 服务，将生成的 css 写入 generatedPath */
      tailwind = crossSpawn(`${binPath}`, ['-i', inputPath, '-o', generatedPath, api.env === 'development' ? '--watch' : ''], {
        stdio: 'inherit',
        cwd: process.env.APP_ROOT || api.cwd,
      });
      tailwind.on('error', (m: any) => {
        api.logger.error('tailwindcss service encounter an error: ' + m);
      });
      if (api.env === 'production') {
        tailwind.on('exit', () => {
          api.logger.info('tailwindcss service exited');
          resolve();
        });
      } else {
        // wait for generatedPath to be created by interval
        const interval = setInterval(() => {
          if (existsSync(generatedPath)) {
            clearInterval(interval);
            resolve();
          }
        }, CHECK_INTERVAL);
        const timer = setTimeout(() => {
          if (!existsSync(generatedPath)) {
            clearInterval(timer);
            api.logger.error(`tailwindcss generate failed after ${api.config.tailwindcss?.timeout ?? 10} seconds, please check your tailwind.css`);
            process.exit(1);
          }
        }, (api.config.tailwindcss?.timeout ?? 10) * 1000);
      }
    });
  });

  /** 将生成的 css 文件加入到 import 中 */
  api.addEntryImports(() => {
    const generatedPath = winPath(join(api.paths.absTmpPath, outputPath));
    return [{ source: generatedPath }];
  });
};
