import {
  createIntl,
  useIntl as originUseIntl,
  IntlShape,
} from '{{{ reactIntlPkgPath }}}';
import { getPluginManager } from '../core/plugin';
// @ts-ignore
import warning from '{{{ warningPkgPath }}}';

export {
  createIntl,
};
export {
  IntlContext,
  IntlProvider,
  RawIntlProvider,
  createIntlCache,
  injectIntl,
} from '{{{ reactIntlPkgPath }}}';

let g_intl: IntlShape;

{{#LocaleList}}
{{#antdLocale}}
import {{lang}}{{country}}{{index}} from '{{{locale}}}';
{{/antdLocale}}
{{#paths}}
import lang_{{lang}}{{country}}{{index}} from "{{{path}}}";
{{/paths}}
{{/LocaleList}}

export const localeInfo: {[key: string]: any} = {
  {{#LocaleList}}
  '{{name}}': {
    messages: {
      {{#paths}}...lang_{{lang}}{{country}}{{index}},{{/paths}}
    },
    locale: '{{locale}}',
    {{#Antd}}antd: {
      {{#antdLocale}}
      ...{{lang}}{{country}}{{index}},
      {{/antdLocale}}
    },{{/Antd}}
    dayjsLocale: '{{dayjsLocale}}',
  },
  {{/LocaleList}}
};

/**
 * 获取当前的 intl 对象，可以在 node 中使用
 * @param locale 需要切换的语言类型
 * @param changeIntl 是否不使用 g_intl
 * @returns IntlShape
 */
export const getIntl = (locale?: string, changeIntl?: boolean) => {
  // 如果全局的 g_intl 存在，且不是 setIntl 调用
  if (g_intl && !changeIntl && !locale) {
    return g_intl;
  }
  // 获取当前 locale
  if (!locale) locale = getLocale();
  // 如果存在于 localeInfo 中
  if (locale && localeInfo[locale]) {
    return createIntl(localeInfo[locale]);
  }
  {{#ExistLocaleDir}}
  // 不存在需要一个报错提醒
  warning(
    !locale||!!localeInfo[locale],
    `The current popular language does not exist, please check the {{{LocaleDir}}} folder!`,
  );
  {{/ExistLocaleDir}}
  // 使用 zh-CN
  if (localeInfo[{{{ DefaultLocale }}}]) {
    return createIntl(localeInfo[{{{ DefaultLocale }}}]);
  }

  // 如果还没有，返回一个空的
  return createIntl({
    locale: localeInfo[{{{ DefaultLocale }}}],
    messages: {}
  });
};

/**
 * 切换全局的 intl 的设置
 * @param locale 语言的key
 */
export const setIntl = (locale: string) => {
  g_intl = getIntl(locale, true);
};

/**
 * 获取当前选择的语言
 * @returns string
 */
export const getLocale = () => {
  const lang = store.get('lang');
  return lang || {{{DefaultLocale}}};
};


/**
 * 获取当前选择的方向
 * @returns string
 */
export const getDirection = () => {
  const lang = getLocale();
  // array with all prefixs for rtl langueges ex: ar-EG , he-IL
  const rtlLangs = ['he', 'ar', 'fa', 'ku']
  const direction =  rtlLangs.filter(lng => lang.startsWith(lng)).length ? 'rtl' : 'ltr';
  return direction;
};

/**
 * 切换语言
 * @param lang 语言的 key
 * @param realReload 是否刷新页面，默认刷新
 * @returns string
 */
export const setLocale = (lang: string, realReload: boolean = true) => {
  if (getLocale() !== lang) {
    store.set('lang', lang || '')
    setIntl(lang);
  }
};

/**
 * 获取语言列表
 * @returns string[]
 */
export const getAllLocales = () => Object.keys(localeInfo);

/**
 * formatMessage语法糖
 * @returns string
 */
export const i18n = (id:string, values?: string | number | boolean | null | undefined | Date): string => {
  if (!g_intl) {
    setIntl(getLocale());
  }
  return g_intl.formatMessage({ id }, values);
}
