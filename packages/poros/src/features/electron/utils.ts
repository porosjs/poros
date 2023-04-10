import { fsExtra, importLazy, logger } from '@umijs/utils';
import path, { dirname } from 'path';
import { IApi } from 'umi';

/**
 * lazy require dep from current package position (preset-umi)
 */
export const lazyImportFromCurrentPkg = (depName: string) => {
  return importLazy(dirname(require.resolve(`${depName}/package.json`)));
};

/**
 * 获取根项目package.json
 */
export function getRootPkg(api: IApi) {
  const pkg = fsExtra.readJSONSync(path.join(api.paths.cwd, 'package.json'));
  if (pkg.devDependencies == null) {
    pkg.devDependencies = {};
  }
  return pkg;
}

/**
 * 获取主进程打包目录
 * @param api
 */
export function getMainBuildPath(api: IApi) {
  return path.join(getAbsOutputPath(api), 'electron');
}

/**
 * 获取渲染打包目录
 * @param api
 */
export function getRendererBuildPath(api: IApi) {
  return path.join(getAbsOutputPath(api), 'bundled');
}

/**
 * 获取打包目录
 * @param api
 */
export function getAbsOutputPath(api: IApi) {
  return api.paths.absOutputPath;
}

/**
 * 获取开发环境编译目录
 * @param api
 */
export function getDevBuildPath(api: IApi) {
  return path.join(api.paths.absTmpPath, 'plugin-electron', 'build');
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

export function printMemoryUsage() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  const rss = process.memoryUsage().rss / 1024 / 1024;
  logger.info(
    `Memory Usage: ${Math.round(used * 100) / 100} MB (RSS: ${
      Math.round(rss * 100) / 100
    } MB)`,
  );
}
