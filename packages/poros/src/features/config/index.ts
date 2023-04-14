import { IApi } from '@porosjs/umi';
import path from 'path';
import { PATHS } from '../../constants';
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
    memo.alias = {
      ...memo.alias,
      '@': PATHS.SRC,
      '@@':
        api.env === 'development'
          ? PATHS.ABS_TMP_PATH
          : PATHS.ABS_PROD_TMP_PATH,
      'poros/renderer': '@porosjs/umi',
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
};
