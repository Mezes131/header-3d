import { useMemo, useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CylinderGeometry, SphereGeometry, ConeGeometry, Object3D } from 'three';
import ExternalGlow from './ExternalGlow';

const POLE_HEIGHT = 8;
const POLE_RADIUS = 0.08;
const LAMP_RADIUS = 0.4;
const BASE_RADIUS = 0.2;
const BASE_HEIGHT = 0.3;

// Street light position to illuminate the family tree
const LIGHT_POSITION = [7, -4.6, 0.5];

// Family tree target position
const TREE_TARGET = [0, 0.3, 0];

// Light color
const LIGHT_COLOR = '#fff0e1';

export default function StreetLight({ onHoverChange }) {
  const [hovered, setHovered] = useState(false);

  // Pole geometry
  const poleGeometry = useMemo(
    () => new CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 16),
    []
  );

  // Base geometry
  const baseGeometry = useMemo(
    () => new CylinderGeometry(BASE_RADIUS, BASE_RADIUS * 1.2, BASE_HEIGHT, 16),
    []
  );

  // Lamp geometry (sphere)
  const lampGeometry = useMemo(() => new SphereGeometry(LAMP_RADIUS, 16, 16), []);

  // Lamp top geometry (inverted cone)
  const lampTopGeometry = useMemo(
    () => new ConeGeometry(LAMP_RADIUS * 0.9, 0.3, 16),
    []
  );

  // Lamp support geometry
  const lampSupportGeometry = useMemo(
    () => new CylinderGeometry(0.1, 0.1, 0.2, 16),
    []
  );

  // Reference for spotLight
  const spotLightRef = useRef();
  const targetRef = useRef(new Object3D());

  // Lamp position in local space
  const lampPosition = [0, BASE_HEIGHT + POLE_HEIGHT + LAMP_RADIUS * 0.3, 0];

  // Configure spotLight target to point towards family tree
  useEffect(() => {
    if (spotLightRef.current) {
      // Calculate direction towards target (absolute position in scene)
      // Street light is in a group at LIGHT_POSITION, so calculate relative direction
      const targetX = TREE_TARGET[0] - LIGHT_POSITION[0];
      const targetY = TREE_TARGET[1] - LIGHT_POSITION[1];
      const targetZ = TREE_TARGET[2] - LIGHT_POSITION[2];
      
      // Position target in group's local space
      targetRef.current.position.set(targetX, targetY, targetZ);
      spotLightRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <group
      position={LIGHT_POSITION}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (onHoverChange) onHoverChange(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        if (onHoverChange) onHoverChange(false);
      }}
    >
      {/* Street light base */}
      <mesh
        geometry={baseGeometry}
        position={[0, BASE_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#2a2f4a" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Main pole */}
      <mesh
        geometry={poleGeometry}
        position={[0, BASE_HEIGHT + POLE_HEIGHT / 2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#3a3f5a" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Lamp support (small cylinder) */}
      <mesh
        geometry={lampSupportGeometry}
        position={[0, BASE_HEIGHT + POLE_HEIGHT - 0.1, 0]}
        castShadow
      >
        <meshStandardMaterial color="#2a2f4a" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Lamp (luminous sphere) */}
      <mesh
        geometry={lampGeometry}
        position={[0, BASE_HEIGHT + POLE_HEIGHT + LAMP_RADIUS * 0.3, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#fff8e1"
          emissive="#fff8e1"
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.05}
        />
      </mesh>

      {/* Lamp top */}
      <mesh
        geometry={lampTopGeometry}
        position={[0, BASE_HEIGHT + POLE_HEIGHT + LAMP_RADIUS * 0.8, 0]}
        rotation={[0, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#2a2f4a" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Main pointLight - general lighting from the lamp */}
      <pointLight
        position={[0, BASE_HEIGHT + POLE_HEIGHT + LAMP_RADIUS * 0.3, 0]}
        color={LIGHT_COLOR}
        intensity={150}
        distance={25}
        decay={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-bias={-0.0001}
      />

      {/* spotLight - directional lighting towards family tree */}
      <spotLight
        ref={spotLightRef}
        position={lampPosition}
        color={LIGHT_COLOR}
        angle={Math.PI / 2.5}
        penumbra={0.4}
        intensity={40}
        distance={30}
        decay={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-bias={-0.8}
      />

      {/* Additional light to illuminate the floor and create reflections */}
      <pointLight
        position={[0, BASE_HEIGHT + POLE_HEIGHT + LAMP_RADIUS * 0.3, 0]}
        color={LIGHT_COLOR}
        intensity={1.5}
        distance={20}
        decay={2}
      />
      <ExternalGlow hovered={hovered} type="light" />
    </group>
  );
}

StreetLight.propTypes = {
  onHoverChange: PropTypes.func,
};

