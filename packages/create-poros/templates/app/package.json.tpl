{
  "name": "{{{ name }}}",
  "version": "1.0.0",
  "private": true,
  "author": "{{{ author }}}",
  "scripts": {
    "build:linux": "poros build --linux",
    "build:mac": "poros build --mac",
    "build:win": "poros build --win  --x64 --ia32",
    "dev": "poros dev",
    "format": "prettier --cache --write .",
    "postinstall": "poros setup",{{#withHusky}}
    "prepare": "husky install",{{/withHusky}}
    "rebuild-deps": "poros rebuild-deps",
    "setup": "poros setup",
    "start": "poros dev"
  },
  "dependencies": {
    "@ant-design/icons": "^5.3.5",
    "@ant-design/plots": "^2.1.15",
    "antd": "^5.10.0",
    "lodash-es": "^4.17.21",
    "poros": "{{{ version }}}",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "systeminformation": "^5.22.6"
  },
  "devDependencies": {
    "@electron/notarize": "^2.1.0",
    "@types/lodash-es": "^4.17.12",
    "@types/node": "^17.0.13",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "electron": "^29.1.6",
    "electron-builder": "^24.13.3",
    "electron-devtools-installer": "^3.2.0",{{#withHusky}}
    "husky": "^8.0.1",{{/withHusky}}
    "lint-staged": "^13.0.3",
    "prettier": "^3.0.3",
    "prettier-plugin-organize-imports": "^3.2.3",
    "prettier-plugin-packagejson": "^2.4.6",
    "tslib": "^2.6.2",
    "typescript": "^5.0.2"
  }
}
