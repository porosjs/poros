// @ts-nocheck

export const IPCInvoker = {
  MainWindow: {
    foo(arg1: string, arg2: number): Promise<string> {
      return __invokeIPC('MainWindow.foo', arg1, arg2);
    },
    foo2(arg1: string, arg2: number): Promise<string> {
      return __invokeIPC('MainWindow.foo2', arg1, arg2);
    },
  },
  TestWindow: {
    foo(arg1: string, arg2: number): Promise<string[]> {
      return __invokeIPC('TestWindow.foo', arg1, arg2);
    },
  },
} as const;
