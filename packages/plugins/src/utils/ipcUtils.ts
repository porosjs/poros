import generator from '@umijs/bundler-utils/compiled/babel/generator';
import * as parser from '@umijs/bundler-utils/compiled/babel/parser';
import traverse from '@umijs/bundler-utils/compiled/babel/traverse';
import * as types from '@umijs/bundler-utils/compiled/babel/types';
import { camelCase } from '@umijs/utils/compiled/lodash';
import { readFileSync } from 'fs';
import { join } from 'path';
import { IApi } from 'umi';
import { glob, winPath } from 'umi/plugin-utils';

export class IpcUtils {
  private windows: {
    file: string;
    importPath: string;
    className: string;
    methods: string[];
    single: boolean;
  }[];

  constructor(private api: IApi | null, private hasHandle: boolean) {
    this.windows = glob
      .sync('**/*.{ts,js}', {
        cwd: join(process.cwd(), 'src/main/windows'),
        absolute: true,
      })
      .map(winPath)
      .map((file) => {
        const content = readFileSync(file, 'utf-8');
        return { file, content };
      })
      .filter(({ file, content }) => {
        if (/\.d.ts$/.test(file)) return false;
        if (/\.(test|e2e|spec).([jt])sx?$/.test(file)) return false;
        return this.isWindowValid({ content, file });
      })
      .map((item) => ({
        ...this.parseWindow(item),
        file: item.file,
        importPath: item.file.substring(0, item.file.lastIndexOf('.')),
      }));
  }

  getAllWindows() {
    return this.windows;
  }

  getRendererInvokers() {
    if (!this.hasHandle) return { import: '', content: '' };

    const opts = glob
      .sync('ipc.{ts,tsx}', {
        cwd: join(process.cwd(), 'src/renderer'),
        absolute: true,
      })
      .map(winPath)
      .map((file) => {
        const content = readFileSync(file, 'utf-8');
        return { file, content };
      })[0];

    const channels = this.parseHandleChannels(opts);

    let importStr = `import type IpcChannelToHandlerMap from '@/renderer/ipc';`;
    let content = '';

    for (const channel of channels) {
      const parameters = channel.parameters.reduce((prev, curr, index) => `${prev ? `${prev}, ` : ''}${curr}: InvokerParameters<'${channel.key}'>[${index}]`, '');
      content += `
function ${camelCase(channel.key)}(${parameters}, opts: { broadcast: true }): void;
function ${camelCase(channel.key)}(${parameters}, opts?: { window?: PorosBrowserWindow }): InvokerReturnType<'${channel.key}'>;
function ${camelCase(channel.key)}(this: PorosBrowserWindow, ${parameters}, opts: any = { broadcast: false, window: this }): InvokerReturnType<'${channel.key}'> | void {
  if (!opts.broadcast) {
    checkBrowserWindow(this);
  }

  return electronInvoke('${channel.key}', opts.broadcast, opts.window, ${channel.parameters.join(', ')}) as any;
}
`;
    }

    content += `
export const rendererInvoker = {`;
    for (const channel of channels) {
      content += `
  ${camelCase(channel.key)},`;
    }
    content += `
} as const;`;

    return { import: importStr, content };
  }

  getMainInvokers() {
    let importStr = '';
    let content = 'export const mainInvoker = {';
    this.windows.forEach(({ className, methods, importPath, single }) => {
      importStr += `import type ${className} from '${importPath}';
`;

      content += `
  ${className}: {
    open(...args: ConstructorParameters<typeof ${className}>): Promise<number> {
      return __invokeIpc('__IPC_OPEN_WINDOW', '${className}', ...args);
    },
`;

      methods.forEach((methodName) => {
        const returnType = `${className}['${methodName}'] extends (...args: any[]) => Promise<infer R> ? R : ReturnType<${className}['${methodName}']>`;
        content += `    ${methodName}(...args: Parameters<${className}['${methodName}']>): Promise<${single ? returnType : `${returnType}[]`}> {
      return __invokeIpc('__IPC_RENDER_MAIN_EXEC', '${className}.${methodName}', ...args);
    },
`;
      });

      content += `  },`;
    });

    content += `
  invoke(windowId: number, method: string, ...args: any[]): Promise<any> {
    return __invokeIpc('__IPC_RENDER_MAIN_EXEC', \`\${windowId}.\${method}\`, ...args);
  }
} as const;`;

    return { import: importStr, content };
  }

  private parseHandleChannels(opts: { content: string; file: string }) {
    const { file, content } = opts;

    const ast = parser.parse(content, {
      sourceType: 'module',
      sourceFilename: file,
      plugins: ['typescript'],
    });

    const channels: { key: string; parameters: string[] }[] = [];
    ast.program.body.forEach((node) => {
      if (
        node.type === 'ExportDefaultDeclaration' &&
        // @ts-expect-error
        node.declaration.type === 'TSInterfaceDeclaration'
      ) {
        // @ts-expect-error
        node.declaration.body.body.forEach((property) => {
          if (property.type === 'TSPropertySignature') {
            channels.push({
              key: property.key.value,
              parameters: property.typeAnnotation.typeAnnotation.parameters.map((item: any) => item.name),
            });
          }
        });
      }
    });

    return channels;
  }

  private isWindowValid(opts: { content: string; file: string }) {
    const { file, content } = opts;

    // transform with babel
    let ret = false;
    const ast = parser.parse(content, {
      sourceType: 'module',
      sourceFilename: file,
      plugins: ['typescript', 'decorators'],
    });
    traverse(ast, {
      ClassDeclaration: (path) => {
        const className = path.node.id?.name;
        const extendsClause = path.node.superClass;

        let baseClassName: string | null = null;
        if (className && extendsClause) {
          // 判断是否是标识符
          if (types.isIdentifier(extendsClause)) {
            baseClassName = extendsClause.name;
          }
        }

        ret = baseClassName === 'PorosBrowserWindow';
      },
    });

    return ret;
  }

  private parseWindow(opts: { content: string; file: string }) {
    const { file, content } = opts;
    const _self = this;

    const result: {
      className: string;
      methods: string[];
      single: boolean;
    } = { className: '', methods: [], single: true };

    const ast = parser.parse(content, {
      sourceType: 'module',
      sourceFilename: file,
      plugins: ['typescript', 'decorators'],
    });
    traverse(ast, {
      ClassDeclaration: (path) => {
        result.className = path.node.id.name;

        // 查找静态属性 single
        path.traverse({
          ClassProperty(innerPath) {
            if (innerPath.node.static && innerPath.node.key.type === 'Identifier' && innerPath.node.key.name === 'single' && innerPath.node.value) {
              result.single = !!(innerPath.node.value as any).value;
            }
          },
        });
      },
      ClassMethod(path) {
        const methodName = (path.node.key as types.Identifier).name;
        const methodDecorators = _self.getDecorators(path.node.decorators);

        if (methodDecorators.includes('IpcHandle')) {
          result.methods.push(methodName);
        }
      },
    });

    return result;
  }

  private getDecorators(decorators: types.Decorator[] | null | undefined): string[] {
    if (!decorators) {
      return [];
    }

    return decorators.map((decorator) => {
      if (types.isIdentifier(decorator.expression)) {
        return decorator.expression.name;
      } else if (types.isCallExpression(decorator.expression) && types.isIdentifier(decorator.expression.callee)) {
        return decorator.expression.callee.name;
      } else {
        // 处理其他情况
        return generator(decorator).code;
      }
    });
  }
}
