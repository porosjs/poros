import { defineConfig } from 'poros';
import builder from './builder';
import routes from './routes';

export default defineConfig({
  npmClient: 'pnpm',
  model: {},
  routes,
  builder,
});
