import { defineConfig } from 'poros';
import builder from './builder.ts.tpl';
import routes from './routes.ts.tpl';

export default defineConfig({
  npmClient: 'pnpm',
  model: {},
  antd: {},
  locale: {},
  routes,
  logger: {
    transports: {
      file: {
        level: 'warn',
        format: '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}',
        maxSize: 1048576,
      },
      console: {
        level: 'debug',
      },
    },
  },
  localStore: {
    schema: {
      unicorn: {
        type: 'string',
        default: '🦄',
      },
    },
  },
  builder,
});
