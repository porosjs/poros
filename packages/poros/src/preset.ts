export default () => {
  return {
    plugins: [
      require.resolve('./features/config'),
      require.resolve('./features/electron'),
      require.resolve('@porosjs/plugins/dist/initial-state'),
      require.resolve('@porosjs/plugins/dist/access'),
      require.resolve('@umijs/plugins/dist/model'),
      require.resolve('@porosjs/plugins/dist/react-query'),
      require.resolve('@porosjs/plugins/dist/locale'),
      require.resolve('@umijs/plugins/dist/antd'),
      require.resolve('@umijs/plugins/dist/request'),
      require.resolve('@porosjs/plugins/dist/qiankun'),
      require.resolve('@porosjs/plugins/dist/ipc'),
      require.resolve('@porosjs/plugins/dist/metisui'),
    ],
  };
};
