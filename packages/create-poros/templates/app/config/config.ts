import { defineConfig } from 'poros';
import builder from './builder';
import routes from './routes';
import logger from './logger.conf';

export default defineConfig({
  npmClient: 'pnpm',
  model: {},
  antd: {},
  locale: {},
  routes,
  logger,
  localStore: {
    schema: {
      unicorn: {
        type: 'string',
        default: '🦄',
      },
    }
  },
  builder,
});
