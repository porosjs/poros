// @ts-nocheck
import { app, net, protocol } from 'electron';
import path from 'path';
import { URL, pathToFileURL } from 'url';
import localStore from './localStore';
import logger from './logger';
import port from './port';
import { isDev } from './utils';
 {{#localeEnable}}
 import { initialize as localeInitialize } from '../plugin-locale/main/localeExports';
 {{/localeEnable}}

const PROTOCOL_SCHEME = 'app';

protocol.registerSchemesAsPrivileged([
  { scheme: 'http', privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
  { scheme: 'https', privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
  { scheme: PROTOCOL_SCHEME, privileges: { secure: true, standard: true, supportFetchAPI: true } },
]);

function initialize() {
  app.whenReady().then(()=>{
    logger.initialize();
    localStore.initialize();
    {{#localeEnable}}
    localeInitialize();
    {{/localeEnable}}

    protocol.handle(PROTOCOL_SCHEME, (req) => {
      const { pathname } = new URL(req.url);
      if (isDev) {
        return net.fetch(`http://localhost:${port}${pathname}`, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
      }

      return net.fetch(
        pathToFileURL(path.join(__dirname, decodeURI(pathname))).toString(),
      );
    });
  })
}

export default initialize;
