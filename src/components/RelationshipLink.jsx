import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Line } from '@react-three/drei';

export default function RelationshipLink({ start, end }) {
  const points = useMemo(() => {
    const [sx, sy, sz] = start;
    const [ex, ey, ez] = end;
    const nearlyEqual = (a, b, epsilon = 0.001) => Math.abs(a - b) < epsilon;

    // Already aligned horizontally or vertically: straight segment.
    if (nearlyEqual(sx, ex) || nearlyEqual(sy, ey)) {
      return [start, end];
    }

    // Build an orthogonal (L-shaped) path: horizontal segment then vertical.
    const midPoint = [ex, sy, (sz + ez) / 2];
    return [start, midPoint, end];
  }, [start, end]);

  return (
    <Line points={points} color="#6fb2ff" lineWidth={2} dashed={false} alphaToCoverage />
  );
}

RelationshipLink.propTypes = {
  start: PropTypes.arrayOf(PropTypes.number).isRequired,
  end: PropTypes.arrayOf(PropTypes.number).isRequired,
};

