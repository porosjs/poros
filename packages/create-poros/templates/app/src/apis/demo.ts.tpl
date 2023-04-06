import { request } from 'poros';

export async function query() {
  return request('/api/hello', { method: 'POST' });
}
