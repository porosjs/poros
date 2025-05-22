import { Spin } from 'metis-ui';

const Loading = () => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
    <Spin size="large" />
  </div>
);

export default Loading;
