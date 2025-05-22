import React from 'react';
{{#Antd}}
import { ConfigProvider as AntdConfigProvider } from 'antd';
{{/Antd}}
{{#Metisui}}
import { ConfigProvider as MetisuiConfigProvider } from 'metis-ui';
{{/Metisui}}

{{#DayjsLocales.length}}
import dayjs from '{{{dayjsPkgPath}}}';
{{#DayjsLocales}}
import '{{{dayjsPkgPath}}}/locale/{{.}}';
{{/DayjsLocales}}
{{/DayjsLocales.length}}
import { RawIntlProvider, getLocale, getDirection , setIntl, getIntl, localeInfo } from './localeExports';

{{#DefaultAntdLocales}}
import {{NormalizeLocalesName}} from '{{{.}}}';
{{/DefaultAntdLocales}}
{{#DefaultMetisuiLocales}}
import {{NormalizeLocalesName}} from '{{{.}}}';
{{/DefaultMetisuiLocales}}

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

  let dom = <RawIntlProvider value={intl}>{props.children}</RawIntlProvider>

  {{#Antd}}
  const defaultAntdLocale = {
    {{#DefaultAntdLocales}}
    ...{{NormalizeLocalesName}},
    {{/DefaultAntdLocales}}
  }
  const antdDirection = getDirection();

  dom = (
    <AntdConfigProvider direction={antdDirection} locale={localeInfo[locale]?.antd || defaultAntdLocale}>
      {dom}
    </AntdConfigProvider>
  )
  {{/Antd}}
  {{#Metisui}}
  const defaultMetisuiLocale = {
    {{#DefaultMetisuiLocales}}
    ...{{NormalizeLocalesName}},
    {{/DefaultMetisuiLocales}}
  }
  const metisuiDirection = getDirection();

  dom = (
    <MetisuiConfigProvider direction={metisuiDirection} locale={localeInfo[locale]?.metisui || defaultMetisuiLocale}>
      {dom}
    </MetisuiConfigProvider>
  )
  {{/Metisui}}

  return dom;
};
