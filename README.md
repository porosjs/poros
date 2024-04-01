# Poros
[![Build With Umi](https://img.shields.io/badge/build%20with-umi-028fe4.svg?style=flat-square)](http://umijs.org/) <a href="https://porosjs.com"><img src="https://img.shields.io/badge/porosjs-poros-blue.svg" alt="poros" /></a>
[![dumi](https://img.shields.io/badge/docs%20by-dumi-blue)](https://github.com/umijs/dumi)

<img src="./logo.png" width="120">

基于 Umi 的 Electron React 框架

> 您可以快速构建一个 Electron 项目，可以开发、打包、升级等，它具备 Umi 的所有功能。它还集成了常用的 electron 库，比如：electron-log、electron-store... 未来还将集成更多功能。

## 快速上手

### 创建项目

先找个地方建个空目录。

```bash
$ mkdir myapp && cd myapp
```

```bash
# pnpm 推荐
pnpm create poros
# npm
npx create-poros@latest
# yarn
yarn create poros
```

### 启动项目

执行`pnpm start`命令

```bash
        ╔═══════════════════════════════╗
ready - ║  Electron app launch success  ║
        ╚═══════════════════════════════╝
event - [Webpack] Compiled in 19830 ms (4955 modules)
info  - [MFSU][eager] write cache
info  - [MFSU] buildDepsAgain
info  - [MFSU] skip buildDeps
```

## 目录结构

```
├── config
│   ├── builder.ts                      // electron-builder config
│   ├── config.ts                       // umi config
│   ├── logger.ts                       // electron-log config
│   └── routes.ts                       // umi routes config
├── mock                                
│   └── demo.ts
├── src
│   ├── constants
│   │   └── index.ts
│   ├── locales                         // locale dir
│   │   ├── en-US.ts
│   │   └── zh-CN.ts
│   ├── main                            // main process dir
│   │   └── index.ts
│   ├── preload                         // preload dir
│   │   └── index.ts
│   ├── renderer                        // renderer process dir, same as umi
│   │   ├── assets
│   │   ├── models
│   │   ├── pages
│   │   ├── utils 
│   │   └── app.ts                      // global setting, same as umi
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── typings.d.ts
```

## 插件

### local

### ipc

### qiankun

> 您也可以直接使用 Umi 插件。如果您遇到任何问题，请联系我。

## 预设插件
- initial-state
- access
- model
- react-query
- antd
- locale
- ipc           // 用于扩展主、渲进程通信

## API

> import { something } from 'poros';

### Main Process

```typescript
/**
 * electron-log
 * https://github.com/megahertz/electron-log
 * >> config/config.ts
 * export default defineConfig({
 *  logger : {
 *    transports: {
 *      file: {
 *        level: 'warn',
 *        format: '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}',
 *        maxSize: 1048576,
 *      },
 *      console: {
 *        level: 'debug',
 *      },
 *    },
 *  }
 * });
 */
import { logger } from 'poros';
logger.info('xxx');
logger.error('xxx');
logger.warn('xxx');

/**
 * electron-store
 * https://github.com/sindresorhus/electron-store
 * export default defineConfig({
 * localStore: {
 *    schema: {
 *      unicorn: {
 *         type: 'string',
 *        default: '🦄',
 *      },
 *    },
 *  },
 * });
 */
import { localStore } from 'poros'; 
localStore.set('unicorn', 'xxx');
localStore.get('unicorn');

/**
 * initialize 
 * Must exec initialize before app ready.
 */
import { initialize } from 'poros';

/**
 * i18n
 * Enable with locale plugin
 * The program will restart after switching languages
 */
import { localeInfo, getIntl, setIntl, getLocale, setLocale, getAllLocales, i18n } from 'poros';

/**
 * utils 
 */
import { isMacOS, isWindows, isLinux, isX86, isX64, isDev, isProd } from 'poros';
```

### Renderer Process

> a little different from umi

```typescript
/**
 * electron-log
 * same usage as in the main process
 */
import { logger } from 'poros';
logger.info('xxx');
logger.error('xxx');
logger.warn('xxx');

/**
 * electron-store
 * same usage as in the main process
 */
import { localStore } from 'poros'; 
localStore.set('unicorn', 'xxx');
localStore.get('unicorn');

/**
 * i18n
 * enable with locale plugin
 * The program will restart after switching languages
 */
import { localeInfo, getIntl, setIntl, getLocale, setLocale, getAllLocales, i18n } from 'poros';
```


## Todo
### Ipc
- point-to-point communication between windows and pages
- one-to-many broadcast communication between windows and pages
- communication between different window or page contexts.

### Windows Management
- provide a window base class
- multi-window management
- window preloading to improve window opening speed

### Main Process HMR
Currently, if changes are made to the main process code, the app automatically restarts, which is inconvenient. In the future, I hope to enable hot updates.
### More Plugins
You can use umi plugins directly. If you have any problems, please contact me.

## Refer
- [umi-plugin-electron-builder](https://github.com/BySlin/umi-plugin-electron-builder) - umi的electron插件


## LICENSE

[MIT](https://github.com/porosjs/poros/blob/main/LICENSE)
