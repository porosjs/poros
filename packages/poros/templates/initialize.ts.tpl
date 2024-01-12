// @ts-nocheck
import { app, net, protocol } from 'electron';
import path from 'path';
import { URL, pathToFileURL } from 'url';
import localStore from './localStore';
import logger from './logger';
import PorosWindowManager from './PorosWindowManager';
{{#localeEnable}}
import { initialize as localeInitialize } from '../plugin-locale/main/localeExports';
{{/localeEnable}}
{{#qiankunMasterEnable}}
import { getMasterAppDir } from '../plugin-qiankun-master/main/masterOptions';
{{/qiankunMasterEnable}}

const PROTOCOL_SCHEME = 'app';

protocol.registerSchemesAsPrivileged([
  { scheme: 'http', privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
  { scheme: 'https', privileges: { standard: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
  { scheme: PROTOCOL_SCHEME, privileges: { secure: true, standard: true, supportFetchAPI: true } },
  {{#qiankunMasterEnable}}
  { scheme: 'qiankun', privileges: { secure: true, standard: true, supportFetchAPI: true } },
  {{/qiankunMasterEnable}}
]);

function initialize() {
  app.whenReady().then(()=>{
    logger.initialize();
    localStore.initialize();
    PorosWindowManager..initialize();
    {{#localeEnable}}
    localeInitialize();
    {{/localeEnable}}

    protocol.handle(PROTOCOL_SCHEME, (req) => {
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
