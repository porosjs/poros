import { chalk, fsExtra } from '@umijs/utils';
import path from 'path';
import { IApi } from 'umi';
import { DIR_NAME_IN_TMP } from './constants';
import { ElectronBuilder } from './types';

/**
 * 获取根项目package.json
 */
export function getRootPkg() {
  const pkg = fsExtra.readJSONSync(path.join(process.cwd(), 'package.json'));
  if (pkg.devDependencies == null) {
    pkg.devDependencies = {};
  }
  return pkg;
}

/**
 * 获取依赖目录
 */
export function getNodeModulesPath() {
  return path.join(process.cwd(), 'node_modules');
}

/**
 * 获取主进程目录
 * @param api
 */
export function getMainSrc(api: IApi) {
  const { mainSrc } = api.config.electronBuilder as ElectronBuilder;
  return path.join(process.cwd(), mainSrc);
}

/**
 * 获取preload目录
 * @param api
 */
export function getPreloadSrc(api: IApi) {
  const { preloadSrc } = api.config.electronBuilder as ElectronBuilder;
  return path.join(process.cwd(), preloadSrc);
}

/**
 * 获取开发环境编译目录
 * @param api
 */
export function getDevBuildDir(api: IApi) {
  return path.join(api.paths.absTmpPath!, DIR_NAME_IN_TMP, 'build');
}

/**
 * 获取electron打包目录
 * @param api
 */
export function getBuildDir(api: IApi) {
  return path.join(getAbsOutputDir(api), 'electron');
}

/**
 * 获取electron打包目录
 * @param api
 */
export function getBundledDir(api: IApi) {
  return path.join(getAbsOutputDir(api), 'bundled');
}

/**
 * 获取打包目录
 * @param api
 */
export function getAbsOutputDir(api: IApi) {
  const { outputDir } = api.config.electronBuilder as ElectronBuilder;
  return path.join(process.cwd(), outputDir);
}

/**
 * 过滤electron输出
 */
export function filterText(s: string) {
  const lines = s
    .trim()
    .split(/\r?\n/)
    .filter((it) => {
      // https://github.com/electron/electron/issues/4420
      // this warning can be safely ignored
      if (
        it.includes("Couldn't set selectedTextBackgroundColor from default ()")
      ) {
        return false;
      }
      if (
        it.includes("Use NSWindow's -titlebarAppearsTransparent=YES instead.")
      ) {
        return false;
      }
      if (it.includes('Debugger listening on')) {
        return false;
      }
      return (
        !it.includes(
          'Warning: This is an experimental feature and could change at any time.',
        ) &&
        !it.includes('No type errors found') &&
        !it.includes('webpack: Compiled successfully.')
      );
    });

  if (lines.length === 0) {
    return null;
  }
  return '  ' + lines.join(`\n  `) + '\n';
}

export function logError(
  label: 'Electron' | 'Renderer' | 'Main',
  error: Error,
) {
  logProcess(label, error.stack || error.toString(), chalk.red);
}

export function logProcess(
  label: 'Electron' | 'Renderer' | 'Main',
  log: string,
  labelColor: any,
) {
  const LABEL_LENGTH = 28;
  if (log == null || log.length === 0 || log.trim().length === 0) {
    return;
  }

  process.stdout.write(
    labelColor.bold(
      `┏ ${label} ${'-'.repeat(LABEL_LENGTH - label.length - 1)}`,
    ) +
      '\n\n' +
      log +
      '\n' +
      labelColor.bold(`┗ ${'-'.repeat(LABEL_LENGTH)}`) +
      '\n',
  );
}
