import { type RequestConfig } from 'poros';

/**
 * 此处为演示代理配置，实际使用可参考umi配置
 * @see https://umijs.org/docs/max/request
 */
export const request: RequestConfig = {
  baseURL: '/api',
  timeout: 1000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
};
