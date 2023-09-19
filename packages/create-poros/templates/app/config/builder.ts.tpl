import { productName } from '../package.json';

export default {
  appId: 'com.electron.demo',
  copyright: `Copyright © ${new Date().getFullYear()} Poros`,
  win: {
    target: ['nsis'],
    icon: 'resources/logo.ico',
    publisherName: 'tuxling',
    verifyUpdateCodeSignature: false,
  },
  nsis: {
    language: '2052',
    oneClick: true,
    perMachine: true,
    allowElevation: true,
    allowToChangeInstallationDirectory: false,
    deleteAppDataOnUninstall: true,
    artifactName: `${productName}-\${version}.\${ext}`,
    runAfterFinish: true,
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true,
    shortcutName: productName,
  },
};

