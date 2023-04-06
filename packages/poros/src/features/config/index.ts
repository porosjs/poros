import { IApi } from 'umi';
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

  api.modifyConfig((memo, args) => {
    memo.alias = {
      ...memo.alias,
      'poros/renderer': 'umi',
      'poros/main': `${args.paths.absTmpPath}/plugin-electron/export`,
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
      current.dependencies?.['umi'] || current.devDependencies?.['umi'];
    if (hasUmi) {
      throw new Error(
        `You are using ${api.appData.umi.importSource}, please remove umi from your dependencies in package.json.`,
      );
    }
  });
};
