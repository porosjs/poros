import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import TinyArea, {
  TinyAreaConfig,
} from '@ant-design/plots/es/components/tiny/area';
import { range } from 'lodash-es';
import { useIpc } from 'poros';
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
      stroke: '#6dd0fa',
      strokeWidth: 2,
    },
  },
  style: {
    fill: '#6dd0fa',
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
      stroke: 'red',
      strokeWidth: 2,
    },
  },
  style: {
    fill: 'red',
    fillOpacity: 0.5,
  },
};

let time = 59;

/**
 * 演示主进程与渲染进程通信
 */
const Chart = () => {
  const [data, setData] = useState<
    { time: number; received: number; transferred: number }[]
  >(() => range(60).map((i) => ({ time: i, received: 0, transferred: 0 })));

  useIpc('network-monitor', (received, transferred) => {
    time++;

    setData((origin) => {
      const [, ...rest] = origin;
      return [...rest, { time, received: -received, transferred }];
    });
  });

  return (
    <div>
      <div
        style={{
          color: 'rgba(0, 0, 0, 0.45)',
          fontSize: 14,
        }}
      >
        网络监控
      </div>
      <TinyArea data={data} {...transferredConfig} />
      <TinyArea data={data} {...receivedConfig} />
      <div style={{ display: 'flex', gap: 16, width: 480 }}>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <div
            style={{
              width: 10,
              height: 10,
              border: '2px solid red',
              borderRadius: 2,
              background: 'rgba(255, 0, 0, .5)',
            }}
          ></div>
          <ArrowUpOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
          <div style={{ fontSize: 12, marginLeft: 'auto' }}>
            {data[data.length - 1].transferred.toFixed(2)} KB/s
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <div
            style={{
              width: 10,
              height: 10,
              border: '2px solid #6dd0fa',
              borderRadius: 2,
              background: 'rgba(109, 208, 250, .5)',
            }}
          ></div>
          <ArrowDownOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
          <div style={{ fontSize: 12, marginLeft: 'auto' }}>
            {-data[data.length - 1].received.toFixed(2)} KB/s
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chart;
