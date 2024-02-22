import { IApi } from '@porosjs/umi';
import { glob, winPath } from '@porosjs/umi/plugin-utils';
import generator from '@umijs/bundler-utils/compiled/babel/generator';
import * as parser from '@umijs/bundler-utils/compiled/babel/parser';
import traverse from '@umijs/bundler-utils/compiled/babel/traverse';
import * as types from '@umijs/bundler-utils/compiled/babel/types';
import { readFileSync } from 'fs';
import { join } from 'path';

export class IPCUtils {
  private api: IApi;
  private windows: {
    file: string;
    importPath: string;
    className: string;
    methods: string[];
    single: boolean;
  }[];

  constructor(api: IApi | null) {
    this.api = api as IApi;
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

  getAllInvokers() {
    let importStr = '';
    let content = 'export const mainInvoker = {';
    this.windows.forEach(({ className, methods, importPath, single }) => {
      importStr += `import type ${className} from '${importPath}';
`;

      content += `
  ${className}: {
    open(...args: ConstructorParameters<typeof ${className}>): Promise<number> {
      return __invokeIPC('__IPC_OPEN_WINDOW', '${className}', ...args);
    },
`;

      methods.forEach((methodName) => {
        const returnType = `${className}['${methodName}'] extends (...args: any[]) => Promise<infer R> ? R : ReturnType<${className}['${methodName}']>`;
        content += `    ${methodName}(...args: Parameters<${className}['${methodName}']>): Promise<${
          single ? returnType : `${returnType}[]`
        }> {
      return __invokeIPC('__IPC_RENDER_MAIN_EXEC', '${className}.${methodName}', ...args);
    },
`;
      });

      content += `  },`;
    });

    content += `
  invoke(windowId: number, method: string, ...args: any[]): Promise<any> {
    return __invokeIPC('__IPC_RENDER_MAIN_EXEC', \`\${windowId}.\${method}\`, ...args);
  }
} as const;`;

    return { import: importStr, content };
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
            if (
              innerPath.node.static &&
              innerPath.node.key.type === 'Identifier' &&
              innerPath.node.key.name === 'single' &&
              innerPath.node.value
            ) {
              result.single = !!(innerPath.node.value as any).value;
            }
          },
        });
      },
      ClassMethod(path) {
        const methodName = (path.node.key as types.Identifier).name;
        const methodDecorators = _self.getDecorators(path.node.decorators);

        if (methodDecorators.includes('IPCHandle')) {
          result.methods.push(methodName);
        }
      },
    });

    return result;
  }

  private getDecorators(
    decorators: types.Decorator[] | null | undefined,
  ): string[] {
    if (!decorators) {
      return [];
    }

    return decorators.map((decorator) => {
      if (types.isIdentifier(decorator.expression)) {
        return decorator.expression.name;
      } else if (
        types.isCallExpression(decorator.expression) &&
        types.isIdentifier(decorator.expression.callee)
      ) {
        return decorator.expression.callee.name;
      } else {
        // 处理其他情况
        return generator(decorator).code;
      }
    });
  }
}
