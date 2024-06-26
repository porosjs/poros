// @ts-nocheck
import { app, net, protocol } from 'electron';
import path from 'path';
import { URL, pathToFileURL } from 'url';
import localStore from './localStore';
import logger from './logger';
{{#proxyOptions}}
import { matchPathFilter } from '{{{httpProxyMiddlewarePath}}}/dist/path-filter';
import { createPathRewriter } from '{{{httpProxyMiddlewarePath}}}/dist/path-rewriter';
import { ReadableStream } from 'stream/web';
{{/proxyOptions}}
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
  { scheme: PROTOCOL_SCHEME, privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true} },
  {{#qiankunMasterEnable}}
  { scheme: 'qiankun', privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true } },
  {{/qiankunMasterEnable}}
]);
{{#proxyOptions}}

const proxyOptions = {{{proxyOptions}}};

async function proxy(req: Request) {
  for (const proxyOption of proxyOptions) {
    const shouldProxy = matchPathFilter(proxyOption.context, req.url);
    if (shouldProxy) {
      const requestInit = {
        body: req.body,
        headers: new Headers(req.headers),
        method: req.method,
        referrer: req.referrer,
        duplex: req.body instanceof ReadableStream ? 'half' : undefined,
        window: null,
        bypassCustomProtocolHandlers: true,
      };

      const { protocol, host, pathname } = new URL(proxyOption.target);

      if (!proxyOption.changeOrigin && requestInit.headers.get('origin')) {
        requestInit.headers.set('origin', new URL(requestInit.headers.get('origin'))?.origin || '');
      }

      const url = new URL(
        req.url.replace(new RegExp(`^${PROTOCOL_SCHEME}:`), protocol),
      );
      url.host = host;
      url.pathname = `${pathname}${url.pathname}`.replace(/\/+/g, '/');
      const pathRewriter = createPathRewriter(proxyOption.pathRewrite);
      if (pathRewriter) {
        const pathname = await pathRewriter(url.pathname);
        url.pathname = pathname;
      }

      logger.info(`proxy ${req.url} to ${url.toString()}`);

      return [url.toString(), requestInit];
    }
  }
  return false;
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
      try {
      {{#proxyOptions}}
        const args = await proxy(req);
        if (args) {
            return await net.fetch(...args);
        }

      {{/proxyOptions}}
        const { pathname } = new URL(req.url);
        return await net.fetch(
          pathToFileURL(path.join(__dirname, decodeURI(pathname))).toString(),
        );
      } catch (error) {
        logger.error(error);
        throw error;
      }
    });
    {{#qiankunMasterEnable}}

    protocol.handle('qiankun', (req) => {
      try {
      {{#proxyOptions}}
        const args = await proxy(req);
        if (args) {
            return await net.fetch(...args);
        }

      {{/proxyOptions}}
        const { hostname, pathname } = new URL(req.url);
        return net.fetch(
          pathToFileURL(path.join(getMasterAppDir(hostname), `${hostname}.asar`, decodeURI(pathname))).toString(),
        );
      } catch (error) {
        logger.error(error);
        throw error;
      }
    });
    {{/qiankunMasterEnable}}
  })
}

export default initialize;
