import WebpackBar from '@porosjs/bundler-webpack/compiled/webpackbar';
import ProgressPlugin from '@porosjs/bundler-webpack/dist/plugins/ProgressPlugin';
import { Env } from '@porosjs/bundler-webpack/dist/types';
import { IApi } from '@porosjs/umi';
import { chokidar, fsExtra, glob, lodash, logger } from '@umijs/utils';
import { debounce, isEmpty } from '@umijs/utils/compiled/lodash';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { build } from 'electron-builder';
import path from 'path';
import yargs from 'yargs';
import { PATHS, PLUGIN_DIR_NAME } from '../../constants';
import externalPackagesConfig from './external-packages.config';
import { getDevBanner, getDevBuildPath, getMainBuildPath, getRendererBuildPath, getRootPkg, lazyImportFromCurrentPkg, pathIncludes, printLogs, printMemoryUsage } from './utils';

const bundlerWebpack: typeof import('@porosjs/bundler-webpack') = lazyImportFromCurrentPkg('@porosjs/bundler-webpack');
const bundlerVite: typeof import('@porosjs/bundler-vite') = lazyImportFromCurrentPkg('@porosjs/bundler-vite');

const WAIT_TIME = 1000;

async function buildElectron(api: IApi) {
  const { builder, externals } = api.config;

  const absOutputPath = api.paths.absOutputPath;
  const buildPkg = getRootPkg(api);
  buildPkg.main = 'main.js';

  delete buildPkg.scripts;
  delete buildPkg.devDependencies;

  //删除不需要的依赖
  Object.keys(buildPkg.dependencies).forEach((dependency) => {
    if (!externals[dependency] || !externalPackagesConfig.includes(dependency)) {
      delete buildPkg.dependencies[dependency];
    }
  });

  Object.keys(externals).forEach((external: string) => {
    if (!buildPkg.dependencies[external]) {
      buildPkg.dependencies[external] = require(path.join(api.paths.absNodeModulesPath, external, 'package.json'))?.version;
    }
  });

  const buildPath = getMainBuildPath(api);

  fsExtra.copySync(buildPath, getRendererBuildPath(api), { overwrite: true });
  fsExtra.rmSync(buildPath, { recursive: true, force: true });

  // Prevent electron-builder from installing app deps
  fsExtra.ensureDirSync(`${absOutputPath}/node_modules`);

  fsExtra.writeFileSync(`${absOutputPath}/package.json`, JSON.stringify(buildPkg, null, 2));

  const defaultBuildConfig = {
    directories: {
      output: path.join(absOutputPath, '..'),
      app: `${absOutputPath}`,
    },
    files: ['**'],
    extends: null,
  };

  // 打包electron
  logger.wait('[Electron] building...');
  const { configureBuildCommand } = require('electron-builder/out/builder');
  const builderArgs = yargs.command(['build', '*'], 'Build', configureBuildCommand).parse(process.argv);

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

  const outputPath = api.env === Env.development ? getDevBuildPath(api) : getMainBuildPath(api);

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

    config.plugins.delete('node-polyfill-provider');
    config.plugins.delete('mini-css-extract-plugin');

    return config;
  };
  const modifyWebpackConfig = async (memo: any) => {
    memo.output.filename = 'main.js';
    memo.target = 'electron-main';
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
      alias: { ...api.config.alias, poros: `@@/${PLUGIN_DIR_NAME}/exports` },
      fastRefresh: false,
    },
    env: api.env,
    cwd: process.cwd(),
    rootDir: PATHS.MAIN_SRC,
    entry: { main: PATHS.MAIN_INDEX },
    ...(enableVite ? { modifyViteConfig } : { chainWebpack, modifyWebpackConfig }),
    ...(api.env === Env.production && {
      onBuildComplete() {
        printMemoryUsage('Main');
      },
    }),
    clean: api.env !== 'development',
  };

  logger.wait('[Main] Compiling...');

  if (enableVite) {
    await bundlerVite.build(opts);
  } else {
    await bundlerWebpack.build(opts);
  }
}

async function buildPreload(api: IApi) {
  const enableVite = !!api.config.vite;

  const outputPath = path.join(api.env === Env.development ? getDevBuildPath(api) : getMainBuildPath(api), 'preload');

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

  if (!isEmpty(entry)) {
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
      ...(enableVite ? { modifyViteConfig } : { chainWebpack, modifyWebpackConfig }),
      ...(api.env === Env.production && {
        onBuildComplete() {
          printMemoryUsage('Preload');
        },
      }),
      clean: api.env !== 'development',
    };

    logger.wait('[Preload] Compiling...');

    if (enableVite) {
      await bundlerVite.build(opts);
    } else {
      await bundlerWebpack.build(opts);
    }
  }
}

export const runDev = async (api: IApi) => {
  let spawnProcess: ChildProcessWithoutNullStreams | null = null;
  const electronPath = require(path.join(process.cwd(), 'node_modules/electron'));

  await buildPreload(api);
  await buildMain(api);

  let first = true;
  const runMain = () => {
    if (spawnProcess !== null) {
      spawnProcess.kill('SIGKILL');
      spawnProcess = null;
    }

    spawnProcess = spawn(electronPath, [path.join(getDevBuildPath(api), 'main.js')]);
    spawnProcess.stdout.on('data', (data) => {
      printLogs(data.toString());
    });
    spawnProcess.stderr.on('data', (data) => {
      printLogs(data.toString());
    });
    spawnProcess.on('close', (_, signal) => {
      if (signal !== 'SIGKILL') {
        process.exit(-1);
      }
    });

    if (first) {
      const banner = getDevBanner();

      console.log(banner.before);
      logger.ready(banner.main);
      console.log(banner.after);
    }
    first = false;
  };

  const rerunMain = debounce(async () => {
    await buildMain(api);
    await runMain();
  }, WAIT_TIME);

  const rerunPreload = debounce(async () => {
    await buildPreload(api);
    await runMain();
  }, WAIT_TIME);

  const watcher = chokidar.watch([path.join(PATHS.MAIN_SRC, '**'), path.join(PATHS.PRELOAD_SRC, '**')], {
    ignoreInitial: true,
  });
  watcher.on('change', (currentPath) => {
    if (pathIncludes(currentPath, PATHS.MAIN_SRC)) {
      return rerunMain();
    }

    if (pathIncludes(currentPath, PATHS.PRELOAD_SRC)) {
      return rerunPreload();
    }
  });

  runMain();
};

export const runBuild = async (api: IApi) => {
  await buildMain(api);
  await buildPreload(api);

  await buildElectron(api);
};
