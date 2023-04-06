import { z } from '@umijs/utils/compiled/zod';

export function getSchemas(): Record<string, ({}: { zod: typeof z }) => any> {
  return {
    parallel: ({ zod }) => zod.boolean().optional(),
    builder: ({ zod }) => zod.record(zod.string(), zod.any()).optional(),
  };
}
