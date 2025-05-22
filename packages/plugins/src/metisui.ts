import { dirname, join } from 'path';
import { RUNTIME_TYPE_FILE_NAME, type IApi } from 'umi';
import { winPath } from 'umi/plugin-utils';
import { withTmpPath } from './utils/withTmpPath';

export default (api: IApi) => {
  api.describe({
    key: 'metisui',
    config: {
      schema({ zod }) {
        return zod.record(zod.any());
      },
    },
    enableBy: api.EnableBy.config,
  });

  try {
    dirname(require.resolve('metis-ui/package.json'));
  } catch (error) {
    throw new Error(`Can't find metis-ui package. Please install metis-ui first.`);
  }

  api.registerPlugins([require.resolve('./tailwindcss')]);

  const lodashPkg = dirname(require.resolve('lodash/package.json'));
  const lodashPath = {
    merge: winPath(join(lodashPkg, 'merge')),
  };

  api.onGenerateFiles(() => {
    const configProvider = JSON.stringify(api.config.metisui);

    api.writeTmpFile({
      path: `runtime.tsx`,
      context: {
        configProvider,
        lodashPath,
      },
      tplPath: winPath(join(__dirname, '../libs/metisui/runtime.tsx.tpl')),
    });

    api.writeTmpFile({
      path: 'types.d.ts',
      context: {},
      tplPath: winPath(join(__dirname, '../libs/metisui/types.d.ts.tpl')),
    });

    api.writeTmpFile({
      path: RUNTIME_TYPE_FILE_NAME,
      content: `
import type { RuntimeMetisUIConfig } from './types.d';
export type IRuntimeConfig = {
  metisui?: RuntimeMetisUIConfig
};
      `,
    });

    api.writeTmpFile({
      path: 'index.tsx',
      content: `import React from 'react';
import { MetisUIConfigContext } from './context';

export function useMetisUIConfig() {
  return React.useContext(MetisUIConfigContext);
}`,
    });

    api.writeTmpFile({
      path: 'context.tsx',
      content: `import React from 'react';
import type { ConfigProviderProps } from 'metis-ui/es/config-provider';

export const MetisUIConfigContext = React.createContext<[ConfigProviderProps, React.Dispatch<React.SetStateAction<ConfigProviderProps>>]>([{}, ()=>{}]);
`,
    });
  });

  api.addRuntimePlugin(() => [withTmpPath({ api, path: 'runtime.tsx' })]);
  api.addRuntimePluginKey(() => ['metisui']);
};
