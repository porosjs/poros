export default () => {
  return {
    plugins: [
      require.resolve('./features/config'),
      require.resolve('./features/electron'),
      require.resolve('@porosjs/plugins/dist/initial-state'),
      require.resolve('@porosjs/plugins/dist/access'),
      require.resolve('@umijs/plugins/dist/model'),
    ],
  };
};
