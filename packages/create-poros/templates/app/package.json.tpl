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
    "postinstall": "{{#isYarn}}poros patch & {{/isYarn}}poros setup",{{#withHusky}}
    "prepare": "husky install",{{/withHusky}}
    "rebuild-deps": "poros rebuild-deps",
    "setup": "poros setup",
    "start": "poros dev",
    "start:no-mock": "cross-env MOCK=none poros dev"
  },
  "dependencies": {
    "@ant-design/plots": "^2.1.15",
    "@metisjs/icons": "^1.0.1",
    "lodash-es": "^4.17.21",
    "metis-ui": "^1.0.2",
    "poros": "{{{ version }}}",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "systeminformation": "^5.22.6",
    "tailwindcss": "^4.1.7"
  },
  "devDependencies": {
    "@electron/notarize": "^3.0.1",
    "@ianvs/prettier-plugin-sort-imports": "^4.4.1",
    "@types/lodash-es": "^4.17.12",
    "@types/node": "^18.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "cross-env": "^7.0.3",
    "electron": "^36.0.0",
    "electron-builder": "^26.0.12",
    "electron-devtools-installer": "^4.0.0",{{#withHusky}}
    "husky": "^8.0.1",{{/withHusky}}
    "lint-staged": "^13.0.3",
    "prettier": "^3.0.3",
    "prettier-plugin-packagejson": "^2.4.6",
    "prettier-plugin-tailwindcss": "^0.6.11",
    "tslib": "^2.6.2",
    "typescript": "5.1.6"
  },
  "pnpm": {
    "neverBuiltDependencies": []
  }
}
