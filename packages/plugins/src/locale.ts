import { IApi, RUNTIME_TYPE_FILE_NAME } from '@porosjs/umi';
import { Mustache, lodash, winPath } from '@porosjs/umi/plugin-utils';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import {
  IAddAntdLocales,
  IGetLocaleFileListResult,
  exactLocalePaths,
  getAntdLocale,
  getDayjsLocale,
  getLocaleList,
  isNeedPolyfill,
} from './utils/localeUtils';
import { withTmpPath } from './utils/withTmpPath';

interface ILocaleConfig {
  default?: string;
  /** title 开启国际化 */
  title?: boolean;
  antd?: boolean;
  baseSeparator?: string;
}

export const packageNormalize = (packageName: string) =>
  packageName.replace(/[@\/\-.]/g, '_');

export default (api: IApi) => {
  let hasAntd = false;
  try {
    hasAntd = !!require.resolve('antd');
  } catch (e) {
    // api.logger.warn('antd is not installed. <SelecLang /> unavailable');
  }

  const defaultConfig = {
    baseSeparator: '-',
    antd: hasAntd,
  };

  api.describe({
    key: 'locale',
    config: {
      schema({ zod }) {
        return zod
          .object({
            default: zod.string(),
            title: zod.boolean(),
            antd: zod.boolean(),
            baseSeparator: zod.string(),
          })
          .partial();
      },
    },
    enableBy: api.EnableBy.config,
  });

  const reactIntlPkgPath = winPath(
    dirname(require.resolve('react-intl/package')),
  );

  // polyfill
  api.addEntryImportsAhead(() =>
    isNeedPolyfill(api.config.targets || {})
      ? [
          {
            source: require.resolve('intl'),
          },
        ]
      : [],
  );

  const addAntdLocales: IAddAntdLocales = async (args) =>
    await api.applyPlugins({
      key: 'addAntdLocales',
      type: api.ApplyPluginsType.add,
      initialValue: [
        `antd/${api.config?.ssr ? 'lib' : 'es'}/locale/${getAntdLocale(
          args.lang,
          args.country,
        )}`,
      ],
      args,
    });

  const getList = async (
    resolveKey: string,
  ): Promise<IGetLocaleFileListResult[]> => {
    const { paths } = api;
    return getLocaleList({
      localeFolder: 'locales',
      separator: api.config.locale?.baseSeparator,
      absSrcPath: join(paths.absSrcPath, '..'),
      addAntdLocales,
      resolveKey,
    });
  };

  api.onGenerateFiles(async () => {
    const localeTpl = readFileSync(
      join(__dirname, '../libs/locale/render/locale.tpl'),
      'utf-8',
    );
    // dayjs2dayjs
    const resolveKey = api.config.dayjs2dayjs ? 'dayjs' : 'dayjs';
    const dayjsPkgPath = winPath(
      dirname(require.resolve(`${resolveKey}/package.json`)),
    );
    const EventEmitterPkg = winPath(
      dirname(require.resolve('event-emitter/package')),
    );

    const { baseSeparator, antd, title, useLocalStorage } = {
      ...defaultConfig,
      ...(api.config.locale as ILocaleConfig),
    };
    const defaultLocale = api.config.locale?.default || `zh${baseSeparator}CN`;
    const localeList = await getList(resolveKey);
    const dayjsLocales = localeList
      .map(({ dayjsLocale }) => dayjsLocale)
      .filter((locale) => locale);
    const antdLocales = localeList
      .map(({ antdLocale }) => antdLocale)
      .filter((locale) => locale);

    let DayjsLocales = dayjsLocales;
    let DefaultDayjsLocale = '';
    // set dayjs default accounding to locale.default
    if (!DayjsLocales.length && api.config.locale?.default) {
      const [lang, country = ''] = defaultLocale.split(baseSeparator);
      const { dayjsLocale } = getDayjsLocale(lang, country, resolveKey);
      if (dayjsLocale) {
        DayjsLocales = [dayjsLocale];
        DefaultDayjsLocale = dayjsLocale;
      }
    }

    let DefaultAntdLocales: string[] = [];
    // set antd default locale
    if (!antdLocales.length && api.config.locale?.antd) {
      const [lang, country = ''] = defaultLocale.split(baseSeparator);
      DefaultAntdLocales = lodash.uniq(
        await addAntdLocales({
          lang,
          country,
        }),
      );
    }
    const NormalizeAntdLocalesName = function () {
      // @ts-ignore
      return packageNormalize(this);
    };

    api.writeTmpFile({
      content: Mustache.render(localeTpl, {
        DayjsLocales,
        DefaultDayjsLocale,
        NormalizeAntdLocalesName,
        DefaultAntdLocales,
        Antd: !!antd,
        Title: title && api.config.title,
        BaseSeparator: baseSeparator,
        DefaultLocale: defaultLocale,
        dayjsPkgPath,
      }),
      path: 'render/locale.tsx',
    });

    const localeExportsTpl = readFileSync(
      join(__dirname, '../libs/locale/render/localeExports.tpl'),
      'utf-8',
    );
    const localeDirName = 'locales';
    const localeDirPath = join(api.paths!.absSrcPath!, '..', localeDirName);
    api.writeTmpFile({
      path: 'render/localeExports.ts',
      content: Mustache.render(localeExportsTpl, {
        EventEmitterPkg,
        BaseSeparator: baseSeparator,
        UseLocalStorage: !!useLocalStorage,
        LocaleDir: localeDirName,
        ExistLocaleDir: existsSync(localeDirPath),
        LocaleList: localeList.map((locale) => ({
          ...locale,
          antdLocale: locale.antdLocale.map((antdLocale, index) => ({
            locale: antdLocale,
            index: index,
          })),
          paths: locale.paths.map((path, index) => ({
            path,
            index,
          })),
        })),
        Antd: !!antd,
        DefaultLocale: JSON.stringify(defaultLocale),
        warningPkgPath: winPath(dirname(require.resolve('warning/package'))),
        reactIntlPkgPath,
      }),
    });
    // runtime.tsx
    const runtimeTpl = readFileSync(
      join(__dirname, '../libs/locale/render/runtime.tpl'),
      'utf-8',
    );
    api.writeTmpFile({
      path: 'render/runtime.tsx',
      content: Mustache.render(runtimeTpl, {
        Title: !!title,
      }),
    });

    // SelectLang.tsx
    const selectLang = readFileSync(
      join(__dirname, '../libs/locale/render/SelectLang.tpl'),
      'utf-8',
    );

    api.writeTmpFile({
      path: 'render/SelectLang.tsx',
      content: Mustache.render(selectLang, {
        Antd: !!antd,
        LocaleList: localeList,
        ShowSelectLang: localeList.length > 1 && !!antd,
        antdFiles: api.config?.ssr ? 'lib' : 'es',
      }),
    });

    // index.ts
    api.writeTmpFile({
      path: 'index.ts',
      content: `
export { addLocale, setLocale, getLocale, getIntl, useIntl, injectIntl, getAllLocales, IntlProvider, RawIntlProvider } from './render/localeExports';
export { SelectLang } from './render/SelectLang';
`,
    });
    api.writeTmpFile({
      path: RUNTIME_TYPE_FILE_NAME,
      content: `
import {
  IntlCache,
  createIntl,
} from '${reactIntlPkgPath}';
type OptionalIntlConfig = Omit<Parameters<typeof createIntl>[0], 'locale' | 'defaultLocale'>;
export interface IRuntimeConfig {
    locale?: {
      getLocale?: () => string;
      cache?: IntlCache;
    } & OptionalIntlConfig;
};`,
    });
  });

  // Runtime Plugin
  api.addRuntimePlugin(() => [
    withTmpPath({ api, path: 'render/runtime.tsx' }),
  ]);
  api.addRuntimePluginKey(() => ['locale']);

  // watch locale files
  api.addTmpGenerateWatcherPaths(async () => {
    const localeList = await getList('dayjs');
    return exactLocalePaths(localeList);
  });
};
