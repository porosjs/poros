import { fsExtra, lodash, rimraf } from '@umijs/utils';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { build } from 'electron-builder';
import path from 'path';
import { IApi } from 'umi';
import yargs from 'yargs';
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
  api.logger.info('build electron');
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

  api.logger.info('build electron success');
  process.exit();
}

async function buildMain(api: IApi) {
  const mode: 'none' | 'development' | 'production' =
    api.env === 'development' ? 'development' : 'production';
  const outputPath =
    mode === 'development' ? getDevBuildPath(api) : getMainBuildPath(api);

  rimraf.sync(outputPath);
}

async function buildPreload(api: IApi) {}

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
      api.logger.info(log);
    }
  });
  spawnProcess.stderr.on('data', (data) => {
    const log = filterText(data.toString());
    if (log) {
      api.logger.error(log);
    }
  });
  spawnProcess.on('close', (_, signal) => {
    if (signal != 'SIGKILL') {
      process.exit(-1);
    }
  });
};

export const runBuild = async (api: IApi) => {
  await buildMain(api);
  await buildPreload(api);

  await buildElectron(api);
};
