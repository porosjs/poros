import { Typography } from 'antd';
import { i18n, localStore, logger, useModel } from 'poros';
import { useEffect } from 'react';
import styles from './index.less';

const HomePage: React.FC = () => {
  const { name } = useModel('demo');

  useEffect(() => {
    logger.info(name);
    logger.info(
      `获取localStore中值，你可以自由的在主进程和渲染进程中设置和获取：${localStore.get(
        'unicorn',
      )}`,
    );
    // @ts-ignore
    logger.info(__PRELOAD);
  }, []);

  return (
    <div className={styles.container}>
      <Typography.Title level={3}>{i18n('hello.poros')}</Typography.Title>
    </div>
  );
};

export default HomePage;
