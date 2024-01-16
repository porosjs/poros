import { IApi } from '@porosjs/umi';

export default (api: IApi) => {
  api.describe({
    config: {
      schema({ zod }) {
        return zod.object({}).partial();
      },
    },
    enableBy: api.EnableBy.config,
  });
};
