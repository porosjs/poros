{
  "private": true,
  "author": "{{{ author }}}",
  "scripts": {
    "start": "poros dev",
    "build:win": "poros build --win  --x64 --ia32",
    "build:mac": "poros build --mac",
    "build:linux": "poros build --linux",
    "format": "prettier --cache --write .",
    "rebuild-deps": "poros rebuild-deps",{{#withHusky}}
    "prepare": "husky install",{{/withHusky}}
    "postinstall": "poros setup",
    "setup": "poros setup"
  },
  "dependencies": {
    "poros": "{{{ version }}}",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^17.0.13",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "electron": "^22.3.1",
    "electron-builder": "^23.6.0",
    "electron-devtools-installer": "^3.2.0",
    "electron-notarize": "^1.2.2",{{#withHusky}}
    "husky": "^8.0.1",{{/withHusky}}
    "lint-staged": "^13.0.3",
    "prettier": "^2.7.1",
    "prettier-plugin-organize-imports": "^2",
    "prettier-plugin-packagejson": "^2",
    "typescript": "^5.0.0"
  }
}
