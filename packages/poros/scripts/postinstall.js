const { logger, winPath } = require('@umijs/utils');
const { copySync, readFileSync, removeSync, writeFileSync }=require('@umijs/utils/compiled/fs-extra')
const { dirname, join } = require('path');


const isPnpm = winPath(process.cwd()).includes('/.pnpm/')
const isWindows = process.platform === 'win32';

function annotate(contents, lines) {
  for (const line of lines) {
    const lineContent = contents[line - 1];
    if (!lineContent.startsWith('//')) {
      contents.splice(line - 1, 1, '//' + lineContent);
    }
  }
}

function replace(contents, lines) {
  for (const [line, lineContent] of lines) {
    contents.splice(line - 1, 1, lineContent);
  }
}

function copyForPnpm(name) {
  const sourcePath = dirname(require.resolve(`${name}/package.json`));
  if (isPnpm && isWindows) {
    const distPath = join(__dirname, '../node_modules', name);
    if (sourcePath !== distPath) {
      removeSync(distPath);
      copySync(sourcePath, distPath);
    }
    return distPath;
  }

  return sourcePath;
}

function patchPackage(name, opts) {
  const dirPath = copyForPnpm(name);

  let patched = false;
  for (const opt of opts) {
    const { file, annotates = [], replaces = [] } = opt;
    const filePath = join(dirPath, file);

    let contents = readFileSync(filePath, 'utf-8').split('\n');

    if (contents[0] !== '/*PATCHED*/') {
      annotate(contents, annotates);
      replace(contents, replaces);

      writeFileSync(
        filePath,
        `/*PATCHED*/
${contents.join('\n')}`,
        'utf8',
      );

      patched = true;
    }
  }
  if (patched) logger.info(`${name} already patched`);
}

  patchPackage('@umijs/bundler-webpack', [
    {
      file: 'dist/server/server.js',
      annotates: [213, 214, 215, 216],
    },
    {
      file: 'dist/build.d.ts',
      replaces: [[20, "} & Pick<IConfigOpts, 'cache' | 'pkg' | 'env'>;"]],
    },
    {
      file: 'dist/build.js',
      replaces: [[50, '    env: opts.env ?? import_types.Env.production,']],
    },
  ]);

  patchPackage('@umijs/bundler-vite', [
    {
      file: 'dist/server/server.js',
      annotates: [110, 111, 112, 113],
    },
    {
      file: 'dist/build.d.ts',
      replaces: [
        [
          12,
          `    modifyViteConfig?: Function;
        env?: Env;`,
        ],
        [1, `import { Env, IBabelPlugin, IConfig } from './types';`],
      ],
    },
    {
      file: 'dist/build.js',
      replaces: [[82, '    env: opts.env ?? import_types.Env.production,']],
    },
  ]);

  patchPackage('@umijs/preset-umi', [
    {
      file: 'dist/features/appData/appData.js',
      replaces: [[57, `    memo.hasSrcDir = api.paths.absSrcPath.includes("/src");`]],
    },
    {
      file: 'dist/commands/dev/plugins/ViteHtmlPlugin.js',
      replaces: [[40, '                `${api.paths.absTmpPath}/umi.ts`.replace(process.cwd(), "")']],
    },
    {
      file: 'dist/commands/generators/tailwindcss.js',
      replaces: [
        [58, "    './${srcPrefix}renderer/pages/**/*.tsx',"],
        [59, "    './${srcPrefix}renderer/components/**/*.tsx',"],
        [60, "    './${srcPrefix}renderer/layouts/**/*.tsx'"],
      ],
    },
    {
      file: 'dist/commands/generators/tsconfig.js',
      replaces: [[62, '  "extends": "${(0, import_path.relative)(process.cwd(), api.paths.absTmpPath)}/tsconfig.json"']],
    },
    {
      file: 'dist/commands/mfsu/util.js',
      replaces: [[55, '    import_utils.logger.info(import_utils.chalk.cyan(`Umi v${api.appData.umi.version}`));']],
    },
    {
      file: 'dist/features/tmpFiles/routes.js',
      replaces: [
        [
          68,
          `          component = component.replace(
            "@/",
            \`\${(0, import_utils.winPath)((0, import_path.relative)(
              opts.api.paths.absPagesPath,
              opts.api.config.alias["@"]
            ))}/\`
          );`,
        ],
        [77, `          (0, import_utils.winPath)(\`\${opts.api.config.alias["@"]}/\`),`],
        [
          136,
          `          file = file.replace(
            "@/",
            \`\${(0, import_path.relative)(
              opts.api.paths.absPagesPath,
              opts.api.config.alias["@"]
            )}/\`
          );`,
        ],
      ],
    },
    {
      file: 'dist/features/tmpFiles/tmpFiles.js',
      annotates: [113, 114],
      replaces: [
        [73, '    const umiTempDir = (0, import_utils.winPath)((0, import_path.relative)(api.cwd, api.paths.absTmpPath));'],
        [
          93,
          `            allowSyntheticDefaultImports: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,`,
        ],
        [103, ''],
        [
          345,
          `    const pages = (0, import_path.relative)(
            api.cwd,`,
        ],
        [348, '    const prefix = hasSrc ? `../../../${pages}/` : `../../${pages}/`;'],
      ],
    },
  ]);
  patchPackage('umi', []);
