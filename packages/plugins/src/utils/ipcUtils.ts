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
  count: number = 1;
  constructor(api: IApi | null) {
    this.api = api as IApi;
  }

  getAllHandles() {
    const windows = glob
      .sync('**/*.{ts,js}', {
        cwd: join(process.cwd(), 'src/main/windows'),
        absolute: true,
      })
      .map(winPath)
      .map((file) => {
        const content = readFileSync(file, 'utf-8');
        return [file, content];
      })
      .filter(([file, content]) => {
        if (/\.d.ts$/.test(file)) return false;
        if (/\.(test|e2e|spec).([jt])sx?$/.test(file)) return false;
        return this.isWindowValid({ content, file });
      });

    // 生成.d.ts
    this.genDTS(windows.map(([file]) => file));

    return windows.map(([file, content]) =>
      this.parseWindow({ content, file }),
    );
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
      ipcHandles: {
        methodName: string;
        parameters: { name: string; type: string }[];
        returnType: string;
      }[];
    } = { className: '', ipcHandles: [] };

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
        const returnTypeAnnotation = path.node.returnType;
        const methodDecorators = _self.getDecorators(path.node.decorators);
        const methodParameters = _self.getParameters(path.node.params);
        const returnType = returnTypeAnnotation
          ? generator(returnTypeAnnotation).code
          : 'void';

        if (methodDecorators.includes('IPCHandle')) {
          result.ipcHandles.push({
            methodName,
            parameters: methodParameters,
            returnType,
          });
        }
      },
      ImportDeclaration(path) {
        const importPath = path.node.source.value;
        const importTypes: {
          importPath: string;
          typeName: string;
          mode: string;
        }[] = [];

        path.node.specifiers.forEach((specifier) => {
          if (types.isImportSpecifier(specifier)) {
            const typeName = specifier.imported.name;
            importTypes.push({ importPath, typeName, mode: 'specifier' });
          } else if (types.isImportDefaultSpecifier(specifier)) {
            const typeName = specifier.local.name;
            importTypes.push({ importPath, typeName, mode: 'default' });
          } else if (types.isImportNamespaceSpecifier(specifier)) {
            const typeName = specifier.local.name;
            importTypes.push({ importPath, typeName, mode: 'namespace' });
          }
        });

        console.log(importTypes);
      },
    });

    console.log(JSON.stringify(result));

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

  private getParameters(
    params: types.LVal[],
  ): { name: string; type: string }[] {
    return params.map((param) => {
      if (types.isIdentifier(param)) {
        // 简单情况，参数为标识符
        return { name: param.name, type: this.getTypeAnnotation(param) }; // 这里假设类型为 any，实际应根据需求获取类型信息
      } else if (
        types.isAssignmentPattern(param) &&
        types.isIdentifier(param.left)
      ) {
        // 处理默认参数
        return { name: param.left.name, type: this.getTypeAnnotation(param) }; // 这里假设类型为 any，实际应根据需求获取类型信息
      } else {
        // 处理其他情况，可能需要更复杂的逻辑
        return { name: 'unknown', type: 'unknown' };
      }
    });
  }

  private getTypeAnnotation(param: types.LVal): string {
    let type: string = 'any';
    if (types.isIdentifier(param)) {
      // 参数是标识符，查看是否有类型注解
      if (param.typeAnnotation) {
        type = generator(param.typeAnnotation).code;
      }
    } else if (
      types.isAssignmentPattern(param) &&
      types.isIdentifier(param.left)
    ) {
      // 处理默认参数，同样查看是否有类型注解
      if (param.left.typeAnnotation) {
        type = generator(param.left.typeAnnotation).code;
      }
    }

    return type.replaceAll(':', '').trim();
  }
}
