type ChannelToArgsMap = {
  'redux/get-initial-state': () => unknown;
};

export type Channel = keyof ChannelToArgsMap;
export type Handler<N extends Channel> = ChannelToArgsMap[N];
