import { useRef } from 'react';
import PropTypes from 'prop-types';
import { useFrame } from '@react-three/fiber';

// Generic bounce animator: can bounce on X, Y or Z axis.
export default function BounceAnimator({
  children,
  amplitude = 0.08,
  speed = 2,
  phase = 0,
  axis = 'y',
}) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const offset = Math.sin(t * speed + phase) * amplitude;

    if (axis === 'x') {
      groupRef.current.position.x = offset;
    } else if (axis === 'z') {
      groupRef.current.position.z = offset;
    } else {
      // default: vertical bounce
      groupRef.current.position.y = offset;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

BounceAnimator.propTypes = {
  children: PropTypes.node.isRequired,
  amplitude: PropTypes.number,
  speed: PropTypes.number,
  phase: PropTypes.number,
  axis: PropTypes.oneOf(['x', 'y', 'z']),
};


