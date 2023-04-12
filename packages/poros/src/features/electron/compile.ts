import WebpackBar from '@umijs/bundler-webpack/compiled/webpackbar';
import ProgressPlugin from '@umijs/bundler-webpack/dist/plugins/ProgressPlugin';
import { Env } from '@umijs/bundler-webpack/dist/types';
import { chalk, fsExtra, glob, lodash, logger } from '@umijs/utils';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { build } from 'electron-builder';
import path from 'path';
import { IApi } from 'umi';
import yargs from 'yargs';
import { PATHS } from '../../constants';
import externalPackagesConfig from './external-packages.config';
import {
  filterText,
  getDevBuildPath,
  getMainBuildPath,
  getRendererBuildPath,
  getRootPkg,
  lazyImportFromCurrentPkg,
} from './utils';

const bundlerWebpack: typeof import('@umijs/bundler-webpack') =
  lazyImportFromCurrentPkg('@umijs/bundler-webpack');
const bundlerVite: typeof import('@umijs/bundler-vite') =
  lazyImportFromCurrentPkg('@umijs/bundler-vite');

async function buildElectron(api: IApi) {
  const { builder, externals } = api.config;

  const absOutputPath = api.paths.absOutputPath;
  const buildPkg = getRootPkg(api);
  buildPkg.main = 'main.js';

  delete buildPkg.scripts;
  delete buildPkg.devDependencies;

  //删除不需要的依赖
  Object.keys(buildPkg.dependencies).forEach((dependency) => {
    if (
      !externals.includes(dependency) ||
      !externalPackagesConfig.includes(dependency)
    ) {
      delete buildPkg.dependencies[dependency];
    }
  });

  externals.forEach((external: string) => {
    if (!buildPkg.dependencies[external]) {
      buildPkg.dependencies[external] = require(path.join(
        api.paths.absNodeModulesPath,
        external,
        'package.json',
      ))?.version;
    }
  });

  const buildPath = getMainBuildPath(api);

  fsExtra.copySync(buildPath, getRendererBuildPath(api), { overwrite: true });
  fsExtra.rmSync(buildPath, { recursive: true, force: true });

  // Prevent electron-builder from installing app deps
  fsExtra.ensureDirSync(`${absOutputPath}/bundled/node_modules`);

  fsExtra.writeFileSync(
    `${absOutputPath}/bundled/package.json`,
    JSON.stringify(buildPkg, null, 2),
  );

  const defaultBuildConfig = {
    directories: {
      output: absOutputPath,
      app: `${absOutputPath}/bundled`,
    },
    files: ['**'],
    extends: null,
  };

  // 打包electron
  logger.event('[Electron] building...');
  const { configureBuildCommand } = require('electron-builder/out/builder');
  const builderArgs = yargs
    .command(['build', '*'], 'Build', configureBuildCommand)
    .parse(process.argv);

  await build(
    lodash.merge({
      config: lodash.merge(defaultBuildConfig, builder),
      ...builderArgs,
    }),
  );

  logger.event('[Electron] build success');
  process.exit();
}

async function buildMain(api: IApi) {
  const enableVite = !!api.config.vite;

  const outputPath =
    api.env === 'development' ? getDevBuildPath(api) : getMainBuildPath(api);

  const external: any[] = [...externalPackagesConfig, api.config.externals];

  const chainWebpack = (config: any) => {
    if (api.env === Env.production) {
      config.plugin('progress-plugin').use(WebpackBar, [
        {
          name: 'Main',
          color: 'blue',
        },
      ]);
    } else {
      config.plugin('progress-plugin-dev').use(ProgressPlugin, [
        {
          name: 'Main',
        },
      ]);
    }

    config.plugins.delete('fastRefresh');

    return config;
  };
  const modifyWebpackConfig = async (memo: any) => {
    memo.output.filename = 'main.js';
    memo.target = 'electron-main';
    memo.output.library = 'main';
    memo.output.libraryTarget = 'commonjs2';
    return memo;
  };
  const modifyViteConfig = async (memo: any) => {
    memo.build.rollupOptions.output.entryFileNames = 'main.js';
    memo.build.lib.formats = ['cjs'];

    return memo;
  };

  const opts: any = {
    config: {
      ...api.config,
      external,
      outputPath,
    },
    env: api.env,
    cwd: process.cwd(),
    rootDir: PATHS.MAIN_SRC,
    entry: { main: PATHS.MAIN_INDEX },
    ...(enableVite
      ? { modifyViteConfig }
      : { chainWebpack, modifyWebpackConfig }),
    clean: api.env !== 'development',
  };

  if (enableVite) {
    await bundlerVite.build(opts);
  } else {
    await bundlerWebpack.build(opts);
  }
}

async function buildPreload(api: IApi) {
  const enableVite = !!api.config.vite;

  const outputPath = path.join(
    api.env === 'development' ? getDevBuildPath(api) : getMainBuildPath(api),
    'preload',
  );

  const external: any[] = [...externalPackagesConfig, api.config.externals];

  const chainWebpack = (config: any) => {
    if (api.env === Env.production) {
      config.plugin('progress-plugin').use(WebpackBar, [
        {
          name: 'Preload',
          color: 'pink',
        },
      ]);
    } else {
      config.plugin('progress-plugin-dev').use(ProgressPlugin, [
        {
          name: 'Preload',
        },
      ]);
    }

    config.plugins.delete('fastRefresh');

    return config;
  };
  const modifyWebpackConfig = async (memo: any) => {
    memo.output.filename = '[name].js';
    memo.target = 'electron-preload';
    memo.output.library = 'preload';
    memo.output.libraryTarget = 'commonjs2';
    return memo;
  };
  const modifyViteConfig = async (memo: any) => {
    memo.build.rollupOptions.output.entryFileNames = '[name].js';
    memo.build.lib.formats = ['cjs'];

    return memo;
  };

  const entry = glob
    .sync('*.{ts,tsx,js,jsx}', {
      cwd: PATHS.PRELOAD_SRC,
      dot: true,
      absolute: true,
    })
    .reduce((memo, el) => ({ ...memo, [path.parse(el).name]: el }), {});

  const opts: any = {
    config: {
      ...api.config,
      external,
      outputPath,
    },
    env: api.env,
    cwd: process.cwd(),
    rootDir: PATHS.PRELOAD_SRC,
    entry,
    ...(enableVite
      ? { modifyViteConfig }
      : { chainWebpack, modifyWebpackConfig }),
    clean: api.env !== 'development',
  };

  if (enableVite) {
    await bundlerVite.build(opts);
  } else {
    await bundlerWebpack.build(opts);
  }
}

export const runDev = async (api: IApi) => {
  await buildMain(api);
  await buildPreload(api);

  let spawnProcess: ChildProcessWithoutNullStreams | null = null;

  spawnProcess = spawn('electron', [
    path.join(getDevBuildPath(api), 'main.js'),
  ]);
  spawnProcess.stdout.on('data', (data) => {
    const log = filterText(data.toString());
    if (log) {
      logger.info(`[Electron] ${log}`);
    }
  });
  spawnProcess.stderr.on('data', (data) => {
    const log = filterText(data.toString());
    if (log) {
      logger.error(`[Electron] ${log}`);
    }
  });
  spawnProcess.on('close', (_, signal) => {
    if (signal != 'SIGKILL') {
      process.exit(-1);
    }
  });

  logger.ready(chalk.bold('Application launched'));
};

export const runBuild = async (api: IApi) => {
  await buildMain(api);
  await buildPreload(api);

  await buildElectron(api);
};
