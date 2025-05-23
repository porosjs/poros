import { ComputerDesktopOutline, MoonSparklesOutline, SunOutline } from '@metisjs/icons';
import { Dropdown, MenuProps } from 'metis-ui';
import { MenuClickEventHandler } from 'metis-ui/es/menu/interface';
import { useMetisUIConfig } from 'poros';
import type { FC } from 'react';

export type ThemeName = 'system' | 'light' | 'dark';

const themes = [
  {
    name: 'light',
    icon: <SunOutline />,
    label: '亮色模式',
  },
  {
    name: 'dark',
    icon: <MoonSparklesOutline />,
    label: '暗色模式',
  },
  {
    name: 'system',
    icon: <ComputerDesktopOutline />,
    label: '跟随系统',
  },
];

const ThemeSwitch: FC = () => {
  const [config, setConfig] = useMetisUIConfig();

  const onThemeChange: MenuClickEventHandler = ({ key }) => {
    setConfig({ theme: key as ThemeName });
    localStorage.setItem('theme', key as ThemeName);
  };

  const currentTheme = themes.find((theme) => theme.name === (config.theme ?? 'system'));

  const menu: MenuProps = {
    items: themes.map((theme) => ({
      key: theme.name,
      label: theme.label,
      icon: theme.icon,
    })),
    selectable: true,
    selectedKeys: [currentTheme!.name],
    onClick: onThemeChange,
    className: { item: { icon: '-ms-1 size-5' } },
  };

  return (
    <Dropdown trigger={['click']} menu={menu}>
      <button className="text-text flex items-center *:size-6">{currentTheme?.icon}</button>
    </Dropdown>
  );
};

export default ThemeSwitch;
