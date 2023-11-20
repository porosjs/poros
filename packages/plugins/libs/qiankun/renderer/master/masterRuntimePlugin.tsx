// @ts-nocheck
/* eslint-disable */

import { getPluginManager } from '@@/core/plugin';
import { ApplyPluginsType } from 'poros';
import { prefetchApps } from 'qiankun';
import { insertRoute, noop, patchMicroAppRoute } from './common';
import { getMicroAppRouteComponent } from './getMicroAppRouteComponent';
import { getMasterOptions, setMasterOptions } from './masterOptions';
import { deepFilterLeafRoutes } from './routeUtils';
import { MasterOptions, MicroAppRoute } from './types';

let microAppRuntimeRoutes: MicroAppRoute[];

async function getMasterRuntime() {
  const config = await getPluginManager().applyPlugins({
    key: 'qiankun',
    type: ApplyPluginsType.modify,
    initialValue: {},
    async: true,
  });
  const { master } = config;
  return master || config;
}

// modify route with "microApp" attribute to use real component
function patchMicroAppRouteComponent(routes: any[]) {
  const insertRoutes = microAppRuntimeRoutes.filter(
    (r) => r.insert || r.insertBefore || r.appendChildTo,
  );
  // 先处理 insert 配置
  insertRoutes.forEach((route) => {
    insertRoute(routes, route);
  });

  const getRootRoutes = (routes: any[]) => {
    // 重定向根路由不能用作 microAppRuntimeRoutes 的父节点
    const rootRoute = routes.find(
      // 基于是否有 .to props 判断是否为 redirect
      (route) => route.path === '/' && !route.element?.props?.to,
    );
    if (rootRoute) {
      // 如果根路由是叶子节点，则直接返回其父节点
      if (!rootRoute.children?.length) {
        return routes;
      }
      return getRootRoutes(rootRoute.children);
    }
    return routes;
  };

  const rootRoutes = getRootRoutes(routes);
  if (rootRoutes) {
    const { routeBindingAlias, base, masterHistoryType } =
      getMasterOptions() as MasterOptions;
    microAppRuntimeRoutes.reverse().forEach((microAppRoute) => {
      const patchRoute = (route: any) => {
        patchMicroAppRoute(route, getMicroAppRouteComponent, {
          base,
          routePath: route.path,
          masterHistoryType,
          routeBindingAlias,
        });
        if (route.children?.length) {
          route.children.forEach(patchRoute);
        }
      };

      patchRoute(microAppRoute);
      if (
        !microAppRoute.insert &&
        !microAppRoute.insertBefore &&
        !microAppRoute.appendChildTo
      ) {
        rootRoutes.unshift(microAppRoute);
      }
    });
  }
}

export async function render(oldRender: typeof noop) {
  const runtimeOptions = await getMasterRuntime();
  let masterOptions: MasterOptions = {
    ...getMasterOptions(),
    ...runtimeOptions,
  };

  const masterApps = masterOptions.apps || [];
  const credentialsApps = masterApps.filter((app) => app.credentials);
  if (credentialsApps.length) {
    const defaultFetch = masterOptions.fetch || window.fetch;
    const fetchWithCredentials = (url: string, init?: RequestInit) => {
      // 如果当前 url 为 credentials 应用的 entry，则为其加上 cors 相关配置
      if (credentialsApps.some((app) => app.entry === url)) {
        return defaultFetch(url, {
          ...init,
          mode: 'cors',
          credentials: 'include',
        });
      }
      return defaultFetch(url, init);
    };
    // 设置新的 fetch
    masterOptions = { ...masterOptions, fetch: fetchWithCredentials };
  }

  // 更新 master options
  setMasterOptions(masterOptions);

  const { apps = [], routes, ...options } = masterOptions;
  microAppRuntimeRoutes = routes;

  // 主应用相关的配置注册完毕后即可开启渲染
  oldRender();

  if (apps.length) {
    const { prefetch, ...importEntryOpts } = options;
    if (prefetch === 'all') {
      prefetchApps(apps, importEntryOpts);
    } else if (Array.isArray(prefetch)) {
      const specialPrefetchApps = apps.filter(
        (app) => prefetch.indexOf(app.name) !== -1,
      );
      prefetchApps(specialPrefetchApps, importEntryOpts);
    }
  }
}

export function patchClientRoutes({ routes }: { routes: any[] }) {
  const microAppRoutes = [].concat(
    deepFilterLeafRoutes(routes),
    deepFilterLeafRoutes(microAppRuntimeRoutes),
  );
  // 微应用的 routes 存到 masterOptions.microAppRoutes 下以供 MicroAppLink 使用
  const masterOptions = getMasterOptions();
  masterOptions.microAppRoutes = microAppRoutes;
  setMasterOptions(masterOptions);

  if (microAppRuntimeRoutes) {
    patchMicroAppRouteComponent(routes);
  }
}
