import React from 'react';
{{#Antd}}
import { ConfigProvider } from 'antd';
{{/Antd}}

{{#DayjsLocales.length}}
import dayjs from '{{{dayjsPkgPath}}}';
{{#DayjsLocales}}
import '{{{dayjsPkgPath}}}/locale/{{.}}';
{{/DayjsLocales}}
{{/DayjsLocales.length}}
import { RawIntlProvider, getLocale, getDirection , setIntl, getIntl, localeInfo } from './localeExports';

{{#DefaultAntdLocales}}
import {{NormalizeAntdLocalesName}} from '{{{.}}}';
{{/DefaultAntdLocales}}

export function _onCreate() {
  const locale = getLocale();
  {{#DayjsLocales.length}}
  if (dayjs?.locale) {
    dayjs.locale(localeInfo[locale]?.dayjsLocale || '{{{DefaultDayjsLocale}}}');
  }
  {{/DayjsLocales.length}}
  setIntl(locale);
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? React.useLayoutEffect
    : React.useEffect

export const _LocaleContainer = (props:any) => {
  const initLocale = getLocale();
  const [locale, setLocale] = React.useState(initLocale);
  const [intl, setContainerIntl] = React.useState(() => getIntl(locale, true));

  const handleLangChange = (locale:string) => {
    {{#DayjsLocales.length}}
    if (dayjs?.locale) {
      dayjs.locale(localeInfo[locale]?.dayjsLocale || 'en');
    }
    {{/DayjsLocales.length}}
    setLocale(locale);
    setContainerIntl(getIntl(locale));
  };

  useIsomorphicLayoutEffect(() => {
    {{#Title}}
    // avoid reset route title
    if (typeof document !== 'undefined' && intl.messages['{{.}}']) {
      document.title = intl.formatMessage({ id: '{{.}}' });
    }
    {{/Title}}
  }, []);

  {{#Antd}}
  const defaultAntdLocale = {
    {{#DefaultAntdLocales}}
    ...{{NormalizeAntdLocalesName}},
    {{/DefaultAntdLocales}}
  }
  const direction = getDirection();

  return (
    <ConfigProvider  direction={direction} locale={localeInfo[locale]?.antd || defaultAntdLocale}>
      <RawIntlProvider value={intl}>{props.children}</RawIntlProvider>
    </ConfigProvider>
  )
  {{/Antd}}
  {{^Antd}}
  return <RawIntlProvider value={intl}>{props.children}</RawIntlProvider>;
  {{/Antd}}
};
