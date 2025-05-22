import { fetchFoo } from '@/renderer/apis/foo';
import logoImg from '@/renderer/assets/logo.png';
import LangSwitch from '@/renderer/components/LangSwitch';
import ThemeSwitch from '@/renderer/components/ThemeSwitch';
import { Avatar, Button, Descriptions, Divider, Space, notification } from 'metis-ui';
import { i18n, localStore, logger, mainInvoker, useModel } from 'poros';
import { useEffect, useState } from 'react';
import Chart from './Chart';
import GithubIcon from './GithubIcon';

const HomePage: React.FC = () => {
  const { name } = useModel('demo');

  const [versions, setVersions] = useState<{
    electron: string;
    node: string;
    chrome: string;
    os: string;
  }>();

  useEffect(() => {
    logger.info(name);
    logger.info(`获取localStore中值，你可以自由的在主进程和渲染进程中设置和获取：${localStore.get('unicorn')}`);
    // @ts-ignore
    logger.info(__PRELOAD);
  }, []);

  useEffect(() => {
    mainInvoker.MainWindow.getVersions().then((data) => {
      setVersions(data);
    });
  }, []);

  const gotoGithub = () => {
    mainInvoker.MainWindow.openExternal('https://github.com/porosjs/poros');
  };

  const handleFetch = async () => {
    try {
      const { results } = await fetchFoo();
      const [result] = results;
      notification.success({
        message: 'Fetch Success',
        description: (
          <>
            <div>
              Name:{result.name.last} {result.name.first}
            </div>
            <div>Email:{result.email}</div>
          </>
        ),
      });
      logger.info(results);
    } catch (error) {
      notification.error({
        message: 'Fetch Error',
      });
      logger.error(error);
    }
  };

  const items = [
    {
      key: '1',
      label: i18n('versions.os'),
      content: versions?.os,
    },
    {
      key: '2',
      label: i18n('versions.node'),
      content: versions?.node,
    },
    {
      key: '3',
      label: i18n('versions.electron'),
      content: versions?.electron,
    },
    {
      key: '4',
      label: i18n('versions.chrome'),
      content: versions?.chrome,
    },
  ];

  return (
    <div className="p-6">
      <header className="flex items-center gap-2">
        <Avatar src={logoImg} shape="square" size={64} />
        <span className="ml-2 text-4xl font-medium">Poros</span>
        <Space size={12} className="ml-auto">
          <LangSwitch />
          <ThemeSwitch />
          <span onClick={gotoGithub} className="cursor-pointer">
            <GithubIcon />
          </span>
        </Space>
      </header>
      <Divider />
      <Descriptions items={items} column={2} className="w-120" />
      <Divider />
      <Chart />
      <Divider />
      <Space wrap>
        <Button onClick={handleFetch}>Fetch API</Button>
        <Button onClick={() => mainInvoker.AboutWindow.open()}>{i18n('button.openNewWindow')}</Button>
        <Button onClick={() => mainInvoker.MainWindow.openDevTools()}>{i18n('button.openDevTools')}</Button>
        <Button onClick={() => mainInvoker.MainWindow.openLogDir()}>{i18n('button.openLogDir')}</Button>
      </Space>
    </div>
  );
};

export default HomePage;
