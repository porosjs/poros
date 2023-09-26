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
    "poros": "{{{ version }}}",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@electron/notarize": "^2.1.0",
    "@types/node": "^17.0.13",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "electron": "^26.2.2",
    "electron-builder": "^24.6.4",
    "electron-devtools-installer": "^3.2.0",{{#withHusky}}
    "husky": "^8.0.1",{{/withHusky}}
    "lint-staged": "^13.0.3",
    "prettier": "^2.7.1",
    "prettier-plugin-organize-imports": "^2",
    "prettier-plugin-packagejson": "^2",
    "typescript": "^5.0.0"
  }
}
