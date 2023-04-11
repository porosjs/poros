import { join } from 'path';

export const PATHS = {
  SRC: join(process.cwd(), 'src'),
  MAIN_SRC: join(process.cwd(), 'src/main'),
  MAIN_INDEX: join(process.cwd(), 'src/main/index.ts'),
  RENDERER_SRC: join(process.cwd(), 'src/renderer'),
  ABS_TMP_PATH: join(process.cwd(), 'src/.poros'),
  ABS_NODE_MODULES_PATH: join(process.cwd(), 'node_modules'),
} as const;
