export default interface IpcChannelToHandlerMap {
  'network-monitor': (received: number, transferred: number) => void;
}
