// @ts-nocheck
import { localStore } from 'poros';

const apps: Record<string, any>[] = {{{QiankunApps}}};

const setMasterApps = (newApps: Record<string, any>[]) => {
  apps.push(...newApps);
  localStore.set('apps', apps);
};

const getMasterApps = () => apps;

const getMasterAppDir = (hostname: string) =>
  apps.find((app) => {
    const reg = new RegExp(`\/\/${hostname}\/`);
    return reg.test(app.entry);
  })?.dir;

export { setMasterApps, getMasterApps, getMasterAppDir };
