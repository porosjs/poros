import { defineConfig } from 'poros';
import builder from './builder';
import routes from './routes';

export default defineConfig({
  npmClient: '{{{npmClient}}}',
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
