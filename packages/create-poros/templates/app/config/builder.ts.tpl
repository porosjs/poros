export default {
  appId: 'com.electron.demo',
  copyright: `Copyright © ${new Date().getFullYear()} Poros`,
  mac: {
    category: 'public.app-category.productivity',
    target: ['dmg', 'zip'],
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
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
    publisherName: 'Poros',
    verifyUpdateCodeSignature: false,
  },
  nsis: {
    language: '2052',
    oneClick: false,
    perMachine: true,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
  },
  appx: {
    backgroundColor: '#2f343d',
    publisherDisplayName: 'XXX',
    languages: ['zh-CN'],
  },
  linux: {
    target: ['AppImage'],
    category: 'GNOME;GTK;Network;InstantMessaging',
    desktop: {
      StartupWMClass: process.env.VUE_APP_NAME,
      MimeType: 'x-scheme-handler/poros',
    },
  },
  generateUpdatesFilesForAllChannels: true,
};
