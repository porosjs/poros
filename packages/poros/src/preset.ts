import type { IApi } from 'umi';

export default (api: IApi) => {
  return {
    plugins: [
      require.resolve('@umijs/plugins/dist/access'),
      require.resolve('@umijs/plugins/dist/initial-state'),
      require.resolve('@umijs/plugins/dist/model'),
      require.resolve('@umijs/plugins/dist/qiankun'),
      require.resolve('./plugins/porosAlias'),
      require.resolve('./plugins/porosAppData'),
      require.resolve('./plugins/porosChecker'),
      require.resolve('./plugins/porosElectron'),
    ],
  };
};
