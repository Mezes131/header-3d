import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Shape, ExtrudeGeometry } from 'three';

export default function HeartBadge({ position }) {
  const geometry = useMemo(() => {
    const x = 0;
    const y = 0;
    const heartShape = new Shape();

    heartShape.moveTo(x + 0, y + 0.35);
    heartShape.bezierCurveTo(x + 0, y + 0.35, x - 0.4, y, x - 0.8, y + 0.35);
    heartShape.bezierCurveTo(x - 1.2, y + 0.7, x - 0.9, y + 1.4, x, y + 1.8);
    heartShape.bezierCurveTo(x + 0.9, y + 1.4, x + 1.2, y + 0.7, x + 0.8, y + 0.35);
    heartShape.bezierCurveTo(x + 0.4, y, x + 0, y + 0.35, x + 0, y + 0.35);

    const geometryConfig = {
      depth: 0.15,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    };

    return new ExtrudeGeometry(heartShape, geometryConfig);
  }, []);

  return (
    <mesh position={position} geometry={geometry}>
      <meshStandardMaterial color="#ff4f7a" metalness={0.2} roughness={0.2} />
    </mesh>
  );
}

HeartBadge.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
};

