import { IApi } from 'umi';

export default (api: IApi) => {
  api.modifyAppData((memo) => {
    memo.umi.name = 'Poros';
    memo.umi.importSource = 'poros';
    memo.umi.cliName = 'poros';
    return memo;
  });
};
