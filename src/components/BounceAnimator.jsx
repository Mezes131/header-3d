import { useRef } from 'react';
import PropTypes from 'prop-types';
import { useFrame } from '@react-three/fiber';


export default function BounceAnimator({ children, amplitude = 0.08, speed = 2, phase = 0 }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const offset = Math.sin(t * speed + phase) * amplitude;
    groupRef.current.position.y = offset;
  });

  return <group ref={groupRef}>{children}</group>;
}

BounceAnimator.propTypes = {
  children: PropTypes.node.isRequired,
  amplitude: PropTypes.number,
  speed: PropTypes.number,
  phase: PropTypes.number,
};


