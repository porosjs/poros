const { readFileSync,writeFileSync } = require("@umijs/utils/compiled/fs-extra");
const { join, dirname } = require("path");

function annotate(filePath, lines){
  const contents = readFileSync(filePath, 'utf-8').split('\n');

  for (const line of lines) {
    const lineContent = contents[line - 1]
    if(!lineContent.startsWith('//')){
      contents.splice(line - 1, 1 ,'//' + lineContent);
    }
  }

  writeFileSync(filePath, contents.join('\n'), 'utf8');
}

function insert(filePath, line, lineContent){
  const contents = readFileSync(filePath, 'utf-8').split('\n');

  contents.splice(line-1, 0, lineContent)

  writeFileSync(filePath, contents.join('\n'), 'utf8');
}

const webpackIndexPath = require.resolve('@umijs/bundler-webpack');
const webpackServerPath = join(webpackIndexPath,'../server/server.js');
const webpackServerAnnotates = [211, 212, 213, 214];
annotate(webpackServerPath, webpackServerAnnotates);
console.log('@umijs/bundler-webpack already patched');

const viteIndexPath = require.resolve('@umijs/bundler-vite');
const viteServerPath = join(viteIndexPath,'../server/server.js');
const viteServerAnnotates = [110, 111, 112, 113];
annotate(viteServerPath, viteServerAnnotates);
console.log('@umijs/bundler-vite already patched');

const electronLogVer = require('electron-log/package.json').version;
if(electronLogVer === '5.0.0-rc.1'){
  const electronLogRootPath = dirname(require.resolve('electron-log/package.json'));
  const electronLogApiPath = join(electronLogRootPath,'./src/main/electronApi.js');
  const electronLogApiAnnotates = [167, 168, 169, 175];
  annotate(electronLogApiPath, electronLogApiAnnotates);
  insert(electronLogApiPath, 176, "   return electron.ipcMain;")
  console.log('electron-log already patched');
} else {
  console.warn('electron-log patch version mismatch')
}


