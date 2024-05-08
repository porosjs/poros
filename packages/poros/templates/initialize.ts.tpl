// @ts-nocheck
import { app, net, protocol } from 'electron';
import path from 'path';
import { URL, pathToFileURL } from 'url';
import localStore from './localStore';
import logger from './logger';
import { matchPathFilter } from '{{{httpProxyMiddlewarePath}}}/dist/path-filter';
import { createPathRewriter } from '{{{httpProxyMiddlewarePath}}}/dist/path-rewriter';
{{#localeEnable}}
import { initialize as localeInitialize } from '../plugin-locale/main/localeExports';
{{/localeEnable}}
{{#qiankunMasterEnable}}
import { getMasterAppDir } from '../plugin-qiankun-master/main/masterOptions';
{{/qiankunMasterEnable}}
{{#ipcEnable}}
import { initialize as ipcInitialize } from '../plugin-ipc/main/ipcExports';
{{/ipcEnable}}

const PROTOCOL_SCHEME = 'app';


protocol.registerSchemesAsPrivileged([
  { scheme: 'http', privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
  { scheme: 'https', privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
  { scheme: PROTOCOL_SCHEME, privileges: { secure: true, standard: true, supportFetchAPI: true } },
  {{#qiankunMasterEnable}}
  { scheme: 'qiankun', privileges: { secure: true, standard: true, supportFetchAPI: true } },
  {{/qiankunMasterEnable}}
]);
{{#proxyOptions}}

const proxyOptions = {{{proxyOptions}}};

async function proxy(req: Request) {
  for (const proxyOption of proxyOptions) {
    const shouldProxy = matchPathFilter(proxyOption.context, req.url);
    if (shouldProxy) {
      const { protocol, host, pathname } = new URL(proxyOption.target);
      const requestInit = {
        ...req,
        bypassCustomProtocolHandlers: true,
      };
      if (proxyOption.changeOrigin) {
        requestInit.headers = {
          ...req.headers,
          host,
        };
      }

      const url = new URL(req.url.replace(new RegExp(`^${PROTOCOL_SCHEME}:`), protocol));
      url.host = host;
      url.pathname = `${pathname}${url.pathname}`.replace(/\/+/g, '/');

      const pathRewriter = createPathRewriter(proxyOption.pathRewrite);
      if (pathRewriter) {
        const pathname = await pathRewriter(url.pathname);
        url.pathname = pathname;
        logger.error(`proxy ${req.url} rewriter to ${url.toString()}`)

        return [path, requestInit];
      }

      return [url.toString(), requestInit];
    }
  }
  return null;
}
{{/proxyOptions}}

function initialize() {
  app.whenReady().then(()=>{
    logger.initialize();
    localStore.initialize();
    {{#ipcEnable}}
    ipcInitialize();
    {{/ipcEnable}}
    {{#localeEnable}}
    localeInitialize();
    {{/localeEnable}}

    protocol.handle(PROTOCOL_SCHEME, async (req) => {
      {{#proxyOptions}}
      const proxyResult = await proxy(req);
      if (proxyResult) {
        return net.fetch(pathToFileURL(proxyResult[0], proxyResult[1]));
      }

      {{/proxyOptions}}
      const { pathname } = new URL(req.url);
      return net.fetch(
        pathToFileURL(path.join(__dirname, decodeURI(pathname))).toString(),
      );
    });
    {{#qiankunMasterEnable}}

    protocol.handle('qiankun', (req) => {
      const { hostname, pathname } = new URL(req.url);
      return net.fetch(
        pathToFileURL(path.join(getMasterAppDir(hostname), `${hostname}.asar`, decodeURI(pathname))).toString(),
      );
    });
    {{/qiankunMasterEnable}}
  })
}

export default initialize;
