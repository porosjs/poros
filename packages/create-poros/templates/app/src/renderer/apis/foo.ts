import { request } from 'poros';

export function fetchFoo() {
  return request<{
    results: {
      gender: string;
      name: {
        first: string;
        last: string;
      };
      email: string;
    }[];
  }>('/?results=1');
}
