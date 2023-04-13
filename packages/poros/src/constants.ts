import { join } from 'path';

export const PLUGIN_DIR_NAME = 'plugin-electron';

export const PATHS = {
  SRC: join(process.cwd(), 'src'),
  MAIN_SRC: join(process.cwd(), 'src/main'),
  MAIN_INDEX: join(process.cwd(), 'src/main/index.ts'),
  RENDERER_SRC: join(process.cwd(), 'src/renderer'),
  PRELOAD_SRC: join(process.cwd(), 'src/preload'),
  ABS_TMP_PATH: join(process.cwd(), 'src/.poros'),
  ABS_PROD_TMP_PATH: join(process.cwd(), 'src/.poros-production'),
  PLUGIN_PATH: join(process.cwd(), 'src/.poros', PLUGIN_DIR_NAME),
  PROD_PLUGIN_PATH: join(
    process.cwd(),
    'src/.poros-production',
    PLUGIN_DIR_NAME,
  ),
} as const;
