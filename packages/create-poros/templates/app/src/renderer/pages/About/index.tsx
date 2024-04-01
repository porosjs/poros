import logoImg from '@/renderer/assets/logo.png';
import { Avatar } from 'antd';
import packageInfo from '../../../../package.json';

const About = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <Avatar src={logoImg} shape="square" size={64} />
      <div style={{ marginTop: 12, fontSize: 16, lineHeight: '20px' }}>Poros@{packageInfo.version}</div>
      <div style={{ color: '#999', marginTop: 12 }}>Copyright @Porosjs 2024</div>
    </div>
  );
};

export default About;
