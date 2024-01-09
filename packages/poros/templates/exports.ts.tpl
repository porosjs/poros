// @ts-nocheck
export { default as port } from './port';
export { default as logger } from './logger';
export { default as localStore } from './localStore';
export * as localShortcut from './localShortcut';
export { default as initialize } from './initialize';
{{#localeEnable}}
export * from '../plugin-locale/main/localeExports';
{{/localeEnable}}
{{#qiankunMasterEnable}}
export * from '../plugin-qiankun-master/main/masterOptions';
{{/qiankunMasterEnable}}
export * from './utils';
export { default as PorosBrowserWindow } from './PorosBrowserWindow';
export { default as PorosWindowManager } from './PorosWindowManager';
