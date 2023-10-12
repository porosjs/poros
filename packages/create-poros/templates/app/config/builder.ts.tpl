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
    runAfterFinish: true,
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true,
  },
};

