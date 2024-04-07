const { fsExtra } = require('@umijs/utils');
const { readFileSync, writeFileSync } = require('@umijs/utils/compiled/fs-extra');
const { join, dirname } = require('path');

const isPnpm = fsExtra.existsSync(join(process.cwd(), 'node_modules/.pnpm'));

function annotate(content, lines) {
  const contents = content.split('\n');

  for (const line of lines) {
    const lineContent = contents[line - 1];
    if (!lineContent.startsWith('//')) {
      contents.splice(line - 1, 1, '//' + lineContent);
    }
  }

  return contents.join('\n');
}

function replace(content, lines) {
  const contents = content.split('\n');

  for (const [line, lineContent] of lines) {
    contents.splice(line - 1, 1, lineContent);
  }

  return contents.join('\n');
}

function copyWithPnpm(name) {
  if (isPnpm) {
    const sourcePath = dirname(require.resolve(`${name}/package.json`));
    const distPath = join(__dirname, '../node_modules', name);
    if (sourcePath !== distPath) {
      fsExtra.removeSync(distPath);
      fsExtra.copySync(sourcePath, distPath);
    }
  }
}

function patchPackage(name, opts) {
  copyWithPnpm(name);
  for (const opt of opts) {
    const { file, annotates = [], replaces = [] } = opt;
    const filePath = join(dirname(require.resolve(`${name}/package.json`)), file);

    let content = readFileSync(filePath, 'utf-8');

    if (!content.startsWith('/*PATCHED*/')) {
      content = annotate(content, annotates);
      content = replace(content, replaces);

      writeFileSync(filePath, '/*PATCHED*/' + content, 'utf8');
    }
  }
  console.log(`${name} already patched`);
}

console.log('exec umi patch...');

patchPackage('@umijs/bundler-webpack', [
  {
    file: 'dist/server/server.js',
    annotates: [211, 212, 213, 214],
  },
  {
    file: 'dist/build.d.ts',
    replaces: [[19, "} & Pick<IConfigOpts, 'cache' | 'pkg' | 'env'>;"]],
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
    replaces: [
      [62, '  "extends": "${(0, import_path.relative)(process.cwd(), api.paths.absTmpPath)}/tsconfig.json"'],
    ],
  },
  {
    file: 'dist/commands/mfsu/util.js',
    replaces: [
      [55, "    import_utils.logger.info(import_utils.chalk.cyan(`Umi v${api.appData.umi.version}`));"],
    ],
  },
  {
    file: 'dist/features/tmpFiles/routes.js',
    replaces: [
      [68, `          component = component.replace(
        "@/",
        \`\${(0, import_path.relative)(
          opts.api.paths.absPagesPath,
          opts.api.config.alias["@"]
        )}/\`
      );`],
      [77, `          (0, import_utils.winPath)(\`\${opts.api.config.alias["@"]}/\`),`],
      [103, `          file = file.replace(
        "@/",
        \`\${(0, import_path.relative)(
          opts.api.paths.absPagesPath,
          opts.api.config.alias["@"]
        )}/\`
      );`],
    ],
  },
  {
    file: 'dist/features/tmpFiles/tmpFiles.js',
    replaces: [
      [72, "    const umiTempDir = (0, import_utils.winPath)((0, import_path.relative)(api.cwd, api.paths.absTmpPath));"],
      [86, `            target: "ES5",`],
      [87, `            module: "commonjs",`],
      [88, ``],
      [100, `            allowSyntheticDefaultImports: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,`],
      [352, `    const pages = (0, import_path.relative)(
        api.cwd,`],
      [355, "    const prefix = hasSrc ? `../../../${pages}/` : `../../${pages}/`;"]
    ],
  },
]);
