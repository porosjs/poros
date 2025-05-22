import TinyArea, { TinyAreaConfig } from '@ant-design/plots/es/components/tiny/area';
import { ChevronDownOutline, ChevronUpOutline } from '@metisjs/icons';
import { range } from 'lodash-es';
import { i18n, useIpc } from 'poros';
import { useState } from 'react';

const receivedConfig: TinyAreaConfig = {
  width: 480,
  height: 60,
  padding: 1,
  shapeField: 'smooth',
  xField: 'time',
  yField: 'received',
  animate: false,
  scale: {
    y: { domain: [-100, 0], clamp: true },
  },
  line: {
    style: {
      stroke: 'oklch(74.6% 0.16 232.661)',
      strokeWidth: 2,
    },
  },
  style: {
    fill: 'oklch(74.6% 0.16 232.661)',
    fillOpacity: 0.5,
  },
};

const transferredConfig: TinyAreaConfig = {
  width: 480,
  height: 60,
  padding: 1,
  shapeField: 'smooth',
  xField: 'time',
  yField: 'transferred',
  animate: false,
  scale: {
    y: { domain: [0, 100], clamp: true },
  },
  line: {
    style: {
      stroke: 'oklch(63.7% 0.237 25.331)',
      strokeWidth: 2,
    },
  },
  style: {
    fill: 'oklch(63.7% 0.237 25.331)',
    fillOpacity: 0.5,
  },
};

let time = 59;

/**
 * 演示主进程与渲染进程通信
 */
const Chart = () => {
  const [data, setData] = useState<{ time: number; received: number; transferred: number }[]>(() => range(60).map((i) => ({ time: i, received: 0, transferred: 0 })));

  useIpc('network-monitor', (received, transferred) => {
    time++;

    setData((origin) => {
      const [, ...rest] = origin;
      return [...rest, { time, received: -received, transferred }];
    });
  });

  return (
    <div>
      <div className="text-text-tertiary">{i18n('network.monitor')}</div>
      <TinyArea data={data} {...transferredConfig} />
      <TinyArea data={data} {...receivedConfig} />
      <div className="flex w-120 gap-4">
        <div className="flex flex-1 items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-xs border border-red-500 bg-red-500/50"></div>
          <ChevronUpOutline className="text-text-tertiary size-4" />
          <div className="text-xs">{data[data.length - 1].transferred.toFixed(2)} KB/s</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-xs border border-sky-400 bg-sky-400/50"></div>
          <ChevronDownOutline className="text-text-tertiary size-4" />
          <div className="ml-auto text-xs">{-data[data.length - 1].received.toFixed(2)} KB/s</div>
        </div>
      </div>
    </div>
  );
};

export default Chart;
