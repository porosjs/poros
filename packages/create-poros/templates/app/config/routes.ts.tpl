export default [
  {
    path: '/',
    redirect: '/home',
  },
  {
    name: '首页',
    path: '/home',
    component: '@/renderer/pages/Home',
  },
  {
    name: '关于',
    path: '/about',
    component: '@/renderer/pages/About',
  },
];
