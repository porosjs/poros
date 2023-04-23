import { IApi } from '@porosjs/umi';
import { winPath } from '@porosjs/umi/plugin-utils';
import { join } from 'path';

export function withTmpPath(opts: {
  api: IApi;
  path: string;
  noPluginDir?: boolean;
}) {
  return winPath(
    join(
      opts.api.paths.absTmpPath,
      opts.api.plugin.key && !opts.noPluginDir
        ? `plugin-${opts.api.plugin.key}`
        : '',
      opts.path,
    ),
  );
}
