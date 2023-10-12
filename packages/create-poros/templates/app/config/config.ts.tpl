import { defineConfig } from 'poros';
import builder from './builder';
import routes from './routes';
import logger from './logger';

export default defineConfig({
  npmClient: {{{npmClient}}},
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
