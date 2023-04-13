import { useState } from 'react';
import styles from './index.less';

const HomePage: React.FC = () => {
  const [count, setCount] = useState(1);
  return <div className={styles.container}>Hello, Electron {count}</div>;
};

export default HomePage;
