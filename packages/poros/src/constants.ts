import { join } from 'path';

export const PATHS = {
  MAIN_SRC: join(process.cwd(), 'src/main'),
  MAIN_INDEX: join(process.cwd(), 'src/main/index.ts'),
  RENDERER_SRC: join(process.cwd(), 'src/renderer'),
} as const;
