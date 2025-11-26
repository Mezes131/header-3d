import PropTypes from 'prop-types';
import { Center, Text3D } from '@react-three/drei';

export default function SceneStatusText({ text }) {
  return (
    <Center
      key={text} 
      position={[0, -4.2, 6]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <Text3D
        font="/font/helvetiker_bold.typeface.json"
        size={0.8}
        height={0.1}
        bevelEnabled
        bevelThickness={0.05}
        bevelSize={0.02}
        bevelSegments={4}
      >
        {text}
        <meshStandardMaterial color="#ffffff" />
      </Text3D>
    </Center>
  );
}

SceneStatusText.propTypes = {
  text: PropTypes.string.isRequired,
};


