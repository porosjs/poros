import { glob, lodash, winPath } from '@porosjs/umi/plugin-utils';
import { existsSync } from 'fs';
import { basename, join } from 'path';

export type IAddAntdLocales = (args: {
  lang: string;
  country: string;
}) => Promise<string[]>;

export interface IGetLocaleFileListOpts {
  localeFolder: string;
  separator?: string;
  absSrcPath?: string;
  addAntdLocales: IAddAntdLocales;
  resolveKey: string;
}

/**
 * 获取 dayjs 包的 locale 名称
 * @param lang 语言
 * @param country 国家
 * @param resolveKey 用来resolve的key，dayjs 或者 dayjs，为了使 dayjs 可以替换 dayjs
 */
export const getDayjsLocale = (
  lang: string,
  country: string,
  resolveKey: string,
): { dayjsLocale: string } => {
  const dayjsLocation = require
    .resolve(`${resolveKey}/locale/zh-cn`)
    .replace(/zh\-cn\.js$/, '');

  if (
    existsSync(
      join(dayjsLocation, `${lang}-${country?.toLocaleLowerCase?.()}.js`),
    )
  ) {
    const dayjsLocale = `${lang}-${country?.toLocaleLowerCase?.()}`;
    return {
      dayjsLocale,
    };
  }
  if (existsSync(join(dayjsLocation, `${lang}.js`))) {
    return {
      dayjsLocale: lang,
    };
  }
  return { dayjsLocale: '' };
};

export const getAntdLocale = (lang: string, country: string): string =>
  `${lang}_${(country || lang).toLocaleUpperCase()}`;

export interface IGetLocaleFileListResult {
  lang: string;
  country: string;
  name: string;
  paths: string[];
  antdLocale: string[];
  dayjsLocale: string;
}

/**
 * 有些情况下可能项目包含的locale和antd的不匹配
 * 这个方法用于检测
 * @param localePath
 * @returns
 */
const modulesHasLocale = (localePath: string) => {
  try {
    require.resolve(localePath);
    return true;
  } catch (error) {
    return false;
  }
};

export const getLocaleList = async (
  opts: IGetLocaleFileListOpts,
): Promise<IGetLocaleFileListResult[]> => {
  const {
    localeFolder,
    separator = '-',
    absSrcPath = '',
    addAntdLocales,
    resolveKey = 'dayjs',
  } = opts;
  const localeFileMath = new RegExp(
    `^([a-z]{2})${separator}?([A-Z]{2})?\.(js|json|ts)$`,
  );

  const localeFiles = glob
    .sync('*.{ts,js,json}', {
      cwd: winPath(join(absSrcPath, localeFolder)),
    })
    .map((name) => winPath(join(absSrcPath, localeFolder, name)))
    .filter((p) => localeFileMath.test(basename(p)) && existsSync(p))
    .map((fullName) => {
      const fileName = basename(fullName);
      const fileInfo = localeFileMath
        .exec(fileName)
        ?.slice(1, 3)
        ?.filter(Boolean);
      return {
        name: (fileInfo || []).join(separator),
        path: fullName,
      };
    });

  const groups = lodash.groupBy(localeFiles, 'name');

  const promises = Object.keys(groups).map(async (name) => {
    const [lang, country = ''] = name.split(separator);
    const { dayjsLocale } = getDayjsLocale(lang, country, resolveKey);
    const antdLocale = lodash
      .uniq(await addAntdLocales({ lang, country }))
      .filter((localePath) => modulesHasLocale(localePath));

    return {
      lang,
      name,
      // react-intl Function.supportedLocalesOf
      // Uncaught RangeError: Incorrect locale information provided
      locale: name.split(separator).join('-'),
      country,
      antdLocale,
      paths: groups[name].map((item) => winPath(item.path)),
      dayjsLocale,
    };
  });
  return Promise.all(promises);
};

export const exactLocalePaths = (
  data: IGetLocaleFileListResult[],
): string[] => {
  return lodash.flatten(data.map((item) => item.paths));
};

export function isNeedPolyfill(targets = {}) {
  // data come from https://caniuse.com/#search=intl
  // you can find all browsers in https://github.com/browserslist/browserslist#browsers
  const polyfillTargets = {
    ie: 10,
    firefox: 28,
    chrome: 23,
    safari: 9.1,
    opera: 12.1,
    ios: 9.3,
    ios_saf: 9.3,
    operamini: Infinity,
    op_mini: Infinity,
    android: 4.3,
    blackberry: Infinity,
    operamobile: 12.1,
    op_mob: 12.1,
    explorermobil: 10,
    ie_mob: 10,
    ucandroid: Infinity,
  };
  return (
    Object.keys(targets).find((key) => {
      const lowKey = key.toLocaleLowerCase();
      // @ts-ignore
      return polyfillTargets[lowKey] && polyfillTargets[lowKey] >= targets[key];
    }) !== undefined
  );
}
