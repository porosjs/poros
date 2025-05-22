import logoImg from '@/renderer/assets/logo.png';
import { Avatar } from 'metis-ui';
import packageInfo from '../../../../package.json';

const About = () => {
  return (
    <div className="flex flex-col items-center p-4">
      <Avatar src={logoImg} shape="square" size={64} />
      <div className="mt-3 text-base/5">Poros@{packageInfo.version}</div>
      <div className="text-text-tertiary mt-3">Copyright @Porosjs 2025</div>
    </div>
  );
};

export default About;
