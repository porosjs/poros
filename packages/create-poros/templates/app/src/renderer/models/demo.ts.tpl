// 全局共享数据示例
import { useState } from 'react';

const useDemo = () => {
  const [name, setName] = useState<string>('Poros');
  return {
    name,
    setName,
  };
};

export default useDemo;
