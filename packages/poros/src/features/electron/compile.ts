import { chokidar, fsExtra, lodash } from '@umijs/utils';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';
import { IApi } from 'umi';
import { build as viteBuild } from 'vite';
import yargs from 'yargs';
import externalPackagesConfig from '../external-packages.config';
import { ElectronBuilder } from '../types';
import {
  filterText,
  getAbsOutputDir,
  getBuildDir,
  getBundledDir,
  getDevBuildDir,
  getMainSrc,
  getNodeModulesPath,
  getPreloadSrc,
  getRootPkg,
} from '../utils';
import { getMainViteConfig, getPreloadViteConfig } from './vite';
import {
  getMainWebpackConfig,
  getPreloadWebpackConfig,
  build as webpackBuild,
} from './webpack';

const TIMEOUT = 500;

export function buildElectron(api: IApi) {
  const { builderOptions, externals } = api.config
    .electronBuilder as ElectronBuilder;

  const absOutputDir = getAbsOutputDir(api);
  const buildPkg = getRootPkg();
  buildPkg.main = 'main.js';

  delete buildPkg.scripts;
  delete buildPkg.devDependencies;

  //删除不需要的依赖
  Object.keys(buildPkg.dependencies!).forEach((dependency) => {
    if (
      !externals.includes(dependency) ||
      !externalPackagesConfig.includes(dependency)
    ) {
      delete buildPkg.dependencies![dependency];
    }
  });

  externals.forEach((external) => {
    if (!buildPkg.dependencies![external]) {
      buildPkg.dependencies![external] = require(path.join(
        process.cwd(),
        'node_modules',
        external,
        'package.json',
      ))?.version;
    }
  });

  //处理内置依赖
  const buildDependencies: string[] = [];
  for (const dep of buildDependencies) {
    const depPackageJsonPath = path.join(
      getNodeModulesPath(),
      dep,
      'package.json',
    );
    if (fsExtra.existsSync(depPackageJsonPath)) {
      buildPkg.dependencies![dep] = require(depPackageJsonPath).version;
    } else {
      buildPkg.dependencies![dep] = require(path.join(
        process.cwd(),
        'node_modules',
        dep,
        'package.json',
      ))?.version;
    }
  }

  const buildDir = getBuildDir(api);

  fsExtra.copySync(buildDir, getBundledDir(api), { overwrite: true });
  fsExtra.rmSync(buildDir, { recursive: true, force: true });

  // Prevent electron-builder from installing app deps
  fsExtra.ensureDirSync(`${absOutputDir}/bundled/node_modules`);

  fsExtra.writeFileSync(
    `${absOutputDir}/bundled/package.json`,
    JSON.stringify(buildPkg, null, 2),
  );

  const defaultBuildConfig = {
    directories: {
      output: absOutputDir,
      app: `${absOutputDir}/bundled`,
    },
    files: ['**'],
    extends: null,
  };

  // 打包electron
  api.logger.info('build electron');
  const { configureBuildCommand } = require('electron-builder/out/builder');
  const builderArgs = yargs
    .command(['build', '*'], 'Build', configureBuildCommand)
    .parse(process.argv);
  require('electron-builder')
    .build(
      lodash.merge({
        config: lodash.merge(defaultBuildConfig, builderOptions),
        ...builderArgs,
      }),
    )
    .then(() => {
      api.logger.info('build electron success');
      process.exit();
    });
}

const buildMain = (api: IApi) => {
  const { buildType } = api.config.electronBuilder as ElectronBuilder;

  if (buildType === 'webpack') {
    return webpackBuild(getMainWebpackConfig(api));
  } else {
    return viteBuild(getMainViteConfig(api));
  }
};

const buildPreload = (api: IApi): Promise<any> => {
  const { preloadEntry, buildType } = api.config
    .electronBuilder as ElectronBuilder;

  //preload目录存在才编译
  if (fsExtra.pathExistsSync(getPreloadSrc(api))) {
    const tasks: Promise<any>[] = [];
    if (buildType === 'webpack') {
      for (let inputFileName in preloadEntry) {
        tasks.push(
          webpackBuild(
            getPreloadWebpackConfig(
              api,
              inputFileName,
              preloadEntry[inputFileName],
            ),
          ),
        );
      }
    } else {
      for (let inputFileName in preloadEntry) {
        tasks.push(
          viteBuild(
            getPreloadViteConfig(
              api,
              inputFileName,
              preloadEntry[inputFileName],
            ),
          ),
        );
      }
    }
    return Promise.all(tasks);
  }
  return Promise.resolve();
};

/**
 * 以开发模式运行
 * @param api
 */
export const runDev = async (api: IApi) => {
  const { logProcess, debugPort, parallelBuild } = api.config
    .electronBuilder as ElectronBuilder;
  const electronPath = require(path.join(getNodeModulesPath(), 'electron'));
  let spawnProcess: ChildProcessWithoutNullStreams | null = null;

  const runMain = lodash.debounce(() => {
    if (spawnProcess !== null) {
      spawnProcess.kill('SIGKILL');
      spawnProcess = null;
    }

    spawnProcess = spawn(String(electronPath), [
      `--inspect=${debugPort}`,
      path.join(getDevBuildDir(api), 'main.js'),
    ]);
    spawnProcess.stdout.on('data', (data) => {
      const log = filterText(data.toString());
      if (log) {
        logProcess(log, 'normal');
      }
    });
    spawnProcess.stderr.on('data', (data) => {
      const log = filterText(data.toString());
      if (log) {
        logProcess(log, 'error');
      }
    });
    spawnProcess.on('close', (code, signal) => {
      if (signal != 'SIGKILL') {
        process.exit(-1);
      }
    });

    return spawnProcess;
  }, TIMEOUT);

  const buildMainDebounced = lodash.debounce(() => buildMain(api), TIMEOUT);

  const buildPreloadDebounced = lodash.debounce(
    () => buildPreload(api),
    TIMEOUT,
  );

  const runPreload = lodash.debounce(() => {}, TIMEOUT);

  // 启动electron前编译主进程
  if (!parallelBuild) {
    await Promise.all([buildMain(api), buildPreload(api)]);
  }

  const watcher = chokidar.watch(
    [
      `${getMainSrc(api)}/**`,
      `${getPreloadSrc(api)}/**`,
      `${getDevBuildDir(api)}/**`,
    ],
    { ignoreInitial: true },
  );

  watcher
    .on('unlink', (path) => {
      if (spawnProcess !== null && path.includes(getDevBuildDir(api))) {
        spawnProcess.kill('SIGINT');
        spawnProcess = null;
      }
    })
    .on('add', (path) => {
      if (path.includes(getDevBuildDir(api))) {
        return runMain();
      }

      if (spawnProcess !== undefined && path.includes('preload.js')) {
        return runPreload();
      }
    })
    .on('change', (path) => {
      if (path.includes(getMainSrc(api))) {
        return buildMainDebounced();
      }

      if (path.includes('main.js')) {
        return runMain();
      }

      if (path.includes(getPreloadSrc(api))) {
        return buildPreloadDebounced();
      }

      if (path.includes('preload.js')) {
        return runPreload();
      }
    });

  await runMain();
};

export const runBuild = async (api: IApi) => {
  await buildMain(api);
  await buildPreload(api);
};
