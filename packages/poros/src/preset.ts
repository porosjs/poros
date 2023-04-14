import type { IApi } from '@porosjs/umi';

export default (api: IApi) => {
  return {
    plugins: [
      require.resolve('./features/config'),
      require.resolve('./features/electron'),
      require.resolve('@umijs/plugins/dist/access'),
      require.resolve('@umijs/plugins/dist/initial-state'),
      require.resolve('@umijs/plugins/dist/model'),
      require.resolve('@umijs/plugins/dist/qiankun'),
    ],
  };
};
