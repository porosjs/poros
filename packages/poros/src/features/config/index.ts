import { Env } from '@porosjs/bundler-webpack/dist/types';
import { IApi } from '@porosjs/umi';
import { BaseGenerator, fsExtra, lodash, winPath } from '@umijs/utils';
import path from 'path';
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
    paths.absTmpPath =
      api.env === 'development' ? PATHS.ABS_TMP_PATH : PATHS.ABS_PROD_TMP_PATH;
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
      '@@':
        api.env === 'development'
          ? PATHS.ABS_TMP_PATH
          : PATHS.ABS_PROD_TMP_PATH,
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
    const hasUmi =
      current.dependencies?.['@porosjs/umi'] ||
      current.devDependencies?.['@porosjs/umi'];
    if (hasUmi) {
      throw new Error(
        `You are using ${api.appData.umi.importSource}, please remove umi from your dependencies in package.json.`,
      );
    }

    const hasElectron =
      current.dependencies?.['electron'] ||
      current.devDependencies?.['electron'];
    if (!hasElectron) {
      throw new Error(
        `You are using ${api.appData.umi.importSource}, please install electron.`,
      );
    }
  });

  api.onGenerateFiles(async () => {
    const generator = new BaseGenerator({
      path: path.join(__dirname, '../../..', 'templates'),
      target:
        api.env === Env.development
          ? PATHS.PLUGIN_PATH
          : PATHS.PROD_PLUGIN_PATH,
      data: {
        port: api.appData.port ?? 8000,
        lodashMergePath: winPath(require.resolve('lodash/merge')),
        electronLogPath: winPath(
          path.dirname(require.resolve('electron-log/package.json')),
        ),
        electronLogOptions: api.config.logger
          ? JSON.stringify(api.config.logger as Record<string, any>)
          : false,
        electronStorePath: winPath(require.resolve('electron-store')),
        electronStoreOptions: JSON.stringify(
          api.config.localStore?.schema
            ? lodash.merge(api.config.localStore, {
                schema: {
                  ...(api.isPluginEnable('locale') && {
                    lang: {
                      type: 'string',
                      default:
                        api.config.locale.default ||
                        `zh${api.config.locale.baseSeparator || '-'}CN`,
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
        electronLocalShortcutStorePath: winPath(
          path.dirname(require.resolve('electron-localshortcut')),
        ),
        localeEnable: api.isPluginEnable('locale'),
        qiankunMasterEnable: api.isPluginEnable('qiankun-master'),
      },
      slient: true,
    });
    await generator.run();
  });

  function genLocalStorePreload() {
    fsExtra.copySync(
      path.join(__dirname, '../local-store-preload.js'),
      path.join(
        api.env === Env.development
          ? path.join(getDevBuildPath(api), './preload/local-store-preload.js')
          : path.join(
              getMainBuildPath(api),
              '../preload/local-store-preload.js',
            ),
      ),
      { overwrite: true },
    );
  }

  function genIPCPreload() {
    fsExtra.copySync(
      path.join(__dirname, '../ipc-preload.js'),
      path.join(
        api.env === Env.development
          ? path.join(getDevBuildPath(api), './preload/ipc-preload.js')
          : path.join(getMainBuildPath(api), '../preload/ipc-preload.js'),
      ),
      { overwrite: true },
    );
  }

  api.onBeforeCompiler(() => {
    genLocalStorePreload();
    genIPCPreload();
  });
  api.onBuildComplete(() => {
    genLocalStorePreload();
    genIPCPreload();
  });
};
