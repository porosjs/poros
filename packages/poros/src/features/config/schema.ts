import { z } from '@umijs/utils/compiled/zod';

export function getSchemas(): Record<string, ({}: { zod: typeof z }) => any> {
  return {
    builder: ({ zod }) => zod.record(zod.string(), zod.any()).optional(),
    rendererTarget: ({ zod }) => zod.enum(['electron-renderer', 'web']),
  };
}
