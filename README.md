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
│   ├── builder.ts                      // electron-builder 配置
│   ├── config.ts                       // umi 配置
│   └── routes.ts                       // umi routes 配置
├── mock                                
│   └── demo.ts
├── src
│   ├── constants
│   │   └── index.ts
│   ├── locales                         // 国际化目录,开启国际化插件有效
│   │   ├── en-US.ts
│   │   └── zh-CN.ts
│   ├── main                            // 主进程目录
│   │   └── index.ts
│   ├── preload                         // preload 目录
│   │   └── index.ts
│   ├── renderer                        // 渲染进程目录，同umi
│   │   ├── assets
│   │   ├── models
│   │   ├── pages
│   │   ├── utils 
│   │   ├── ipc.ts                      // 渲染进程与主进程ipc通信定义文件，开启ipc插件有效
│   │   └── app.ts         
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── typings.d.ts
```

## 插件

### local

与umi local插件功能基本相同，开启方法一致，主进程与渲染进程中使用方法相同。

```typescript
import { localeInfo, getIntl, setIntl, getLocale, setLocale, getAllLocales, i18n } from 'poros';

i18n('button.ok');
```

### ipc

简化主进程与渲染进程之间的通信

#### 渲染进程调用主进程

#### 主进程调用渲染进程

### qiankun

> 您也可以直接使用 Umi 插件。如果您遇到任何问题，请联系我。

## 预设插件
- initial-state
- access
- model
- react-query
- antd
- locale
- ipc

## API

> import { something } from 'poros';

### Main Process

| 参数   |  说明 |
|--------|------|
| initialize | 初始化方法，需要在electron初始化时调用 |


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
