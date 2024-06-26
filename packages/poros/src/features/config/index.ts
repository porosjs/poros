import { Env } from '@umijs/bundler-webpack/dist/types';
import { BaseGenerator, fsExtra, lodash, winPath } from '@umijs/utils';
import { existsSync } from '@umijs/utils/compiled/fs-extra';
import path from 'path';
import { IApi } from 'umi';
import { PATHS } from '../../constants';
import { getDevBuildPath, getMainBuildPath } from '../electron/utils';
import { getSchemas } from './schema';

export default (api: IApi) => {
  const schemas = getSchemas();
  for (const key of Object.keys(schemas)) {
    const config: Record<string, any> = {
      schema: schemas[key] || ((Joi: any) => Joi.any()),
    };

    api.registerPlugins([
      {
        id: `poros: config-${key}`,
        key: key,
        config,
      },
    ]);
  }

  api.modifyPaths((paths) => {
    paths.absTmpPath = api.env === 'development' ? PATHS.ABS_TMP_PATH : PATHS.ABS_PROD_TMP_PATH;
    paths.absSrcPath = PATHS.RENDERER_SRC;
    paths.absPagesPath = path.join(PATHS.RENDERER_SRC, 'pages');

    return paths;
  });

  api.modifyConfig((memo) => {
    if (memo.mfsu !== false) {
      lodash.set(memo, 'mfsu.shared.react.singleton', true);
      lodash.set(memo, 'mfsu.shared.react-dom.singleton', true);
    }
    memo.alias = {
      ...memo.alias,
      '@': PATHS.SRC,
      '@@': api.env === 'development' ? PATHS.ABS_TMP_PATH : PATHS.ABS_PROD_TMP_PATH,
      poros: `@@/exports`,
    };

    return memo;
  });

  api.modifyAppData((memo) => {
    memo.umi.name = 'Poros';
    memo.umi.importSource = 'poros';
    memo.umi.cliName = 'poros';

    return memo;
  });

  api.onCheckPkgJSON(({ current }) => {
    const hasUmi = current.dependencies?.['umi'] || current.devDependencies?.['umi'];
    if (hasUmi) {
      throw new Error(`You are using ${api.appData.umi.importSource}, please remove umi from your dependencies in package.json.`);
    }

    const hasElectron = current.dependencies?.['electron'] || current.devDependencies?.['electron'];
    if (!hasElectron) {
      throw new Error(`You are using ${api.appData.umi.importSource}, please install electron.`);
    }
  });

  api.onGenerateFiles(async () => {
    const proxyOptions = Array.isArray(api.config.proxy)
      ? api.config.proxy
      : api.config.proxy.target
      ? [api.config.proxy]
      : Object.keys(api.config.proxy).map((key) => {
          return {
            ...api.config.proxy[key],
            context: key,
          };
        });

    const generator = new BaseGenerator({
      path: path.join(__dirname, '../../..', 'templates'),
      target: api.env === Env.development ? PATHS.PLUGIN_PATH : PATHS.PROD_PLUGIN_PATH,
      data: {
        port: api.appData.port ?? 8000,
        electronLogPath: winPath(path.dirname(require.resolve('electron-log/package.json'))),
        electronLogOptions: api.config.logger ? JSON.stringify(api.config.logger as Record<string, any>) : false,
        electronStorePath: winPath(require.resolve('electron-store')),
        electronStoreOptions: JSON.stringify(
          api.config.localStore?.schema
            ? lodash.merge(api.config.localStore, {
                schema: {
                  ...(api.isPluginEnable('locale') && {
                    lang: {
                      type: 'string',
                      default: api.config.locale.default || `zh${api.config.locale.baseSeparator || '-'}CN`,
                    },
                  }),
                  ...(api.isPluginEnable('qiankun-master') && {
                    apps: {
                      type: 'array',
                      default: [],
                    },
                  }),
                },
              })
            : api.config.localStore,
        ),
        electronLocalShortcutStorePath: winPath(path.dirname(require.resolve('electron-localshortcut'))),
        localeEnable: api.isPluginEnable('locale'),
        qiankunMasterEnable: api.isPluginEnable('qiankun-master'),
        ipcEnable: api.isPluginEnable('ipc'),
        ipcFile: api.isPluginEnable('ipc') && ['ts', 'tsx'].some((ext) => existsSync(path.join(api.paths.absSrcPath, `ipc.${ext}`))),
        httpProxyMiddlewarePath: winPath(path.dirname(require.resolve('http-proxy-middleware/package.json'))),
        proxyOptions: api.env === 'production' && JSON.stringify(proxyOptions),
      },
      slient: true,
    });
    await generator.run();
  });

  api.addTmpGenerateWatcherPaths(() => {
    return [path.join(PATHS.MAIN_SRC, 'windows')];
  });

  api.onBeforeCompiler(() => {
    genLocalStorePreload(api);
  });
  api.onBuildComplete(() => {
    genLocalStorePreload(api);
  });
};

function genLocalStorePreload(api: IApi) {
  fsExtra.copySync(
    path.join(__dirname, '../local-store-preload.js'),
    path.join(api.env === Env.development ? path.join(getDevBuildPath(api), './preload/local-store-preload.js') : path.join(getMainBuildPath(api), '../preload/local-store-preload.js')),
    { overwrite: true },
  );
}
