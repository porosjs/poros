import { IApi } from '@porosjs/umi';
import { glob, winPath } from '@porosjs/umi/plugin-utils';
import generator from '@umijs/bundler-utils/compiled/babel/generator';
import * as parser from '@umijs/bundler-utils/compiled/babel/parser';
import traverse from '@umijs/bundler-utils/compiled/babel/traverse';
import * as types from '@umijs/bundler-utils/compiled/babel/types';
import { readFileSync } from 'fs';
import { join } from 'path';

export class IPCUtils {
  api: IApi;

  constructor(api: IApi | null) {
    this.api = api as IApi;
  }

  getAllInvokers() {
    const windows = glob
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
      });

    const result = windows.map((item) => ({
      ...this.parseWindow(item),
      file: item.file,
    }));
    let importStr = '';
    let content = 'export const ipcInvoker = {';
    result.forEach(({ className, methods, file }) => {
      const filePath = file.substring(0, file.lastIndexOf('.'));

      importStr += `import type ${className} from '${filePath}';
`;

      content += `
  ${className}: {
`;
      methods.forEach((methodName) => {
        content += `    ${methodName}( ...args: Parameters<${className}['${methodName}']>): Promise<${className}['${methodName}'] extends (...args: any[]) => Promise<infer R> ? R : ReturnType<${className}['${methodName}']>> {
      return __invokeIPC('${className}.${methodName}', ...args);
    },
`;
      });
      content += `  },`;
    });
    content += `
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
    } = { className: '', methods: [] };

    const ast = parser.parse(content, {
      sourceType: 'module',
      sourceFilename: file,
      plugins: ['typescript', 'decorators'],
    });
    traverse(ast, {
      ClassDeclaration: (path) => {
        result.className = path.node.id.name;
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
