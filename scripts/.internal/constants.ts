import { join } from 'path';

const ROOT = join(__dirname, '../../');
export const PATHS = {
  ROOT,
  ROOT_CONFIG: join(ROOT, './package.json'),
  PACKAGES: join(ROOT, './packages'),
  EXAMPLES: join(ROOT, './examples'),
  JEST_TURBO_CONFIG: join(ROOT, './jest.turbo.config.ts'),
} as const;

export const SCRIPTS = {
  BUNDLE_DEPS: 'poros-scripts bundleDeps',
  DEV: 'poros-scripts father dev',
  BUILD: 'poros-scripts father build',
  TEST_TURBO: 'poros-scripts jest-turbo',
} as const;
