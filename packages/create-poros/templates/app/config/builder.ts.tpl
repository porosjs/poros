export default {
  appId: 'com.electron.demo',
  copyright: `Copyright © ${new Date().getFullYear()} Poros`,
  mac: {
    category: 'public.app-category.productivity',
    target: ['dmg', 'zip'],
    icon: 'resources/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'resources/entitlements.mac.plist',
    entitlementsInherit: 'resources/entitlements.mac.plist',
  },
  dmg: {
    sign: false,
    contents: [
      {
        type: 'dir',
        x: 159,
        y: 160,
      },
      {
        type: 'link',
        path: '/Applications',
        x: 381,
        y: 160,
      },
    ],
    window: {
      width: 540,
      height: 380,
    },
  },
  win: {
    target: ['nsis'],
    icon: 'resources/logo.png',
    publisherName: 'poros',
    verifyUpdateCodeSignature: false,
  },
  nsis: {
    language: '2052',
    oneClick: false,
    perMachine: true,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    runAfterFinish: true,
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true,
  },
  appx: {
    backgroundColor: '#2f343d',
    publisherDisplayName: 'Poros',
    languages: ['zh-CN'],
  },
  linux: {
    target: ['AppImage'],
    icon: 'resources/logo.png',
    category: 'GNOME;GTK;Network;InstantMessaging',
    desktop: {
      StartupWMClass: 'Poros',
      MimeType: 'x-scheme-handler/metis',
    },
  },
};
