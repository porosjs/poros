import { IApi } from '@porosjs/umi';
import { chalk, fsExtra, importLazy, logger, stripAnsi, winPath } from '@umijs/utils';
import path, { dirname } from 'path';
import { PLUGIN_DIR_NAME } from '../../constants';

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
  return path.join(getRendererBuildPath(api), 'electron');
}

/**
 * 获取渲染打包目录
 * @param api
 */
export function getRendererBuildPath(api: IApi) {
  return api.paths.absOutputPath;
}

/**
 * 获取开发环境编译目录
 * @param api
 */
export function getDevBuildPath(api: IApi) {
  return path.join(api.paths.absTmpPath, PLUGIN_DIR_NAME, 'build');
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
      if (it.includes("Couldn't set selectedTextBackgroundColor from default ()")) {
        return false;
      }
      if (it.includes("Use NSWindow's -titlebarAppearsTransparent=YES instead.")) {
        return false;
      }
      if (it.includes('Debugger listening on')) {
        return false;
      }
      return !it.includes('Warning: This is an experimental feature and could change at any time.') && !it.includes('No type errors found') && !it.includes('webpack: Compiled successfully.') && it !== 'undefined';
    });
  if (!lines || lines.length === 0) {
    return null;
  }
  return (lines.join(`\n  `) + '\n').replace(/\s*$/g, '');
}

export function printMemoryUsage(type: string) {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  const rss = process.memoryUsage().rss / 1024 / 1024;
  logger.info(`[${type}] Memory Usage: ${Math.round(used * 100) / 100} MB (RSS: ${Math.round(rss * 100) / 100} MB)`);
}

const BORDERS = {
  TL: chalk.gray.dim('╔'),
  TR: chalk.gray.dim('╗'),
  BL: chalk.gray.dim('╚'),
  BR: chalk.gray.dim('╝'),
  V: chalk.gray.dim('║'),
  H_PURE: '═',
};

export function getDevBanner(offset = 8) {
  const content = chalk.green.bold('  Electron app launch success  ');

  const maxLen = stripAnsi(content).length;

  // prepare all output lines
  const beforeLines = [`${BORDERS.TL}${chalk.gray.dim(''.padStart(maxLen, BORDERS.H_PURE))}${BORDERS.TR}`];
  const mainLine = `${BORDERS.V}${content}${''.padStart(maxLen - stripAnsi(content).length)}${BORDERS.V}`;
  const afterLines = [`${BORDERS.BL}${chalk.gray.dim(''.padStart(maxLen, BORDERS.H_PURE))}${BORDERS.BR}`];

  // join lines as 3 parts for vertical middle output with logger
  return {
    before: beforeLines.map((l) => l.padStart(l.length + offset)).join('\n'),
    main: mainLine,
    after: afterLines.map((l) => l.padStart(l.length + offset)).join('\n'),
  };
}

/**
 * 判断是否是否为渲染进程日志打印，渲染进程日志包涵（path）scope
 * @param content
 * @returns
 */
export function isRendererLog(content: string) {
  return /\(#\/.*\)/.test(content);
}

/**
 * 多次连续的输出会让log合并，需要做出切分
 * @param content
 * @returns
 */
export function splitLog(content: string) {
  const regex = /(\d{2}:\d{2}:\d{2}\.\d{3}\s+[\s\S]*?›[\s\S]*?)(?=\d{2}:\d{2}:\d{2}\.\d{3}|$)/g;
  const matches = Array.from(content.matchAll(regex), (m) => m[0].trim().replace(/\s+›/, ' ›'));
  return matches;
}

export function pathIncludes(path: string, targetPath: string) {
  return winPath(path).includes(winPath(targetPath));
}
