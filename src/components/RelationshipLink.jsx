import PropTypes from 'prop-types';
import { Line } from '@react-three/drei';

export default function RelationshipLink({ start, end }) {
  return (
    <Line
      points={[start, end]}
      color="#6fb2ff"
      lineWidth={2}
      dashed={false}
      alphaToCoverage
    />
  );
}

RelationshipLink.propTypes = {
  start: PropTypes.arrayOf(PropTypes.number).isRequired,
  end: PropTypes.arrayOf(PropTypes.number).isRequired,
};

