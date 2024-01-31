import { IApi } from '@porosjs/umi';
import { glob, logger, winPath } from '@porosjs/umi/plugin-utils';
import generator from '@umijs/bundler-utils/compiled/babel/generator';
import * as parser from '@umijs/bundler-utils/compiled/babel/parser';
import traverse from '@umijs/bundler-utils/compiled/babel/traverse';
import * as types from '@umijs/bundler-utils/compiled/babel/types';
import { readFileSync } from 'fs';
import { basename, join } from 'path';
import * as ts from 'typescript';

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

    // 生成.d.ts
    this.genDTS(windows.map(({ file }) => file));
    // 生成调用方法
    const result = windows.map((item) => this.parseWindow(item));
    return result;
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

  private genDTS(files: string[]) {
    // 获取编译结果
    const program = ts.createProgram({
      rootNames: files,
      options: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
        strict: true,
        alwaysStrict: true,
        noImplicitReturns: true,
        noImplicitThis: true,
        removeComments: true,
        strictPropertyInitialization: true,
        strictBindCallApply: true,
        strictFunctionTypes: true,
        strictNullChecks: true,
        noImplicitAny: true,
        esModuleInterop: true,
        declaration: true,
        emitDeclarationOnly: true,
        transpileOnly: true,
        forkChecker: true,
      },
    });

    // 获取编译后的 .d.ts 内容
    const emitResult = program.emit(undefined, (fileName, text) => {
      // 替换import路径
      const reg = /(import *.*from *')(.*)(')/gm;
      text.replace(reg, () => {
        return '';
      });

      this.api.writeTmpFile({
        path: `renderer/types/${basename(fileName)}`,
        content: text,
      });
    });

    if (emitResult.emitSkipped) {
      const allDiagnostics = ts.getPreEmitDiagnostics(program);
      allDiagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
          const { line, character } =
            diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
          const message = ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            '\n',
          );
          logger.error(
            `${diagnostic.file.fileName} (${line + 1},${
              character + 1
            }): ${message}`,
          );
        } else {
          logger.error(
            ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          );
        }
      });
      logger.error('PorosBrowserWindows compilation failed');
    }
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
