import { useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFrame } from '@react-three/fiber';
import { Shape, ExtrudeGeometry, SphereGeometry, BoxGeometry } from 'three';
import { CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH } from '../constants/layout';
import { HEART_BADGE_RADIUS, HEART_BADGE_DEPTH } from '../constants/layout';

const GLOW_INTENSITY = 1.5;
const GLOW_SIZE_MULTIPLIER = 1.12; // Glow size relative to object
const GLOW_THICKNESS = 0.08; // Glow thickness

// Function to get number of layers based on type
function getGlowLayers(type) {
  switch (type) {
    case 'card':
      return 4;
    case 'badge':
      return 15;
    case 'light':
      return 3;
    default:
      return 3;
  }
}

// Function to create a rounded rectangular shape (for PersonCard)
function createRoundedRectShape(width, height, radius) {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, Math.min(hw, hh));
  const shape = new Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  shape.closePath();
  return shape;
}

// Function to create a circular shape (for HeartBadge)
function createCircleShape(radius) {
  const shape = new Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return shape;
}

export default function ExternalGlow({ hovered, type = 'card' }) {
  const meshRefs = useRef([]);
  const opacityRef = useRef(0);

  // Opacity animation for smooth effect
  useFrame(() => {
    const targetOpacity = hovered ? GLOW_INTENSITY : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * 0.15;
    // Update all layer materials
    meshRefs.current.forEach((mesh) => {
      if (mesh && mesh.material) {
        mesh.material.opacity = opacityRef.current * (mesh.userData.baseOpacity || 1);
        //mesh.material.emissiveIntensity = opacityRef.current * (mesh.userData.baseOpacity || 1);
      }
    });
  });

  // Glow position according to type
  const glowPosition = useMemo(() => {
    switch (type) {
      case 'light': {
        // Position at lamp level
        const POLE_HEIGHT = 8;
        const BASE_HEIGHT = 0.3;
        const LAMP_RADIUS = 0.4;
        return [0, BASE_HEIGHT + POLE_HEIGHT + LAMP_RADIUS * 0.3, 0];
      }
      default:
        return [0, 0, 0];
    }
  }, [type]);

  // Create multiple layers for gradient effect
  const glowLayers = useMemo(() => {
    const layers = [];
    const numLayers = getGlowLayers(type);
    
    for (let i = 0; i < numLayers; i++) {
      const layerSize = GLOW_SIZE_MULTIPLIER + (i * 0.03); // Each layer is slightly larger
      const layerOpacity = 0.6 / (i + 1); // Decreasing opacity for each layer
      
      let layerGeometry;
      switch (type) {
        case 'card': {
          const outerWidth = CARD_WIDTH * layerSize;
          const outerHeight = CARD_HEIGHT * layerSize;
          const outerRadius = (60 / 512) * outerWidth;
          const innerWidth = CARD_WIDTH * (layerSize - 0.05);
          const innerHeight = CARD_HEIGHT * (layerSize - 0.05);
          const innerRadius = (60 / 512) * innerWidth;

          const outer = createRoundedRectShape(outerWidth, outerHeight, outerRadius);
          const inner = createRoundedRectShape(innerWidth, innerHeight, innerRadius);
          outer.holes.push(inner);

          layerGeometry = new ExtrudeGeometry(outer, {
            depth: CARD_DEPTH + GLOW_THICKNESS * 2,
            bevelEnabled: false,
            steps: 1,
          });
          layerGeometry.translate(0, 0, -(CARD_DEPTH + GLOW_THICKNESS * 2) / 2);
          break;
        }
        case 'badge': {
          const outerRadius = HEART_BADGE_RADIUS * layerSize;
          const innerRadius = HEART_BADGE_RADIUS * (layerSize - 0.05);

          const outer = createCircleShape(outerRadius);
          const inner = createCircleShape(innerRadius);
          outer.holes.push(inner);

          layerGeometry = new ExtrudeGeometry(outer, {
            depth: HEART_BADGE_DEPTH + GLOW_THICKNESS * 2,
            bevelEnabled: false,
            steps: 1,
          });
          layerGeometry.translate(0, 0, -(HEART_BADGE_DEPTH + GLOW_THICKNESS * 2) / 2);
          break;
        }
        case 'light': {
          const lampRadius = 0.4;
          const glowRadius = lampRadius * layerSize * 1.5;
          layerGeometry = new SphereGeometry(glowRadius, 32, 32);
          break;
        }
        default:
          layerGeometry = new BoxGeometry(1, 1, 1);
      }
      
      layers.push({ geometry: layerGeometry, opacity: layerOpacity });
    }
    return layers;
  }, [type]);

  return (
    <group>
      {glowLayers.map((layer, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) {
              meshRefs.current[index] = el;
              el.userData.baseOpacity = layer.opacity;
            }
          }}
          geometry={layer.geometry}
          position={glowPosition}
          renderOrder={-1 - index} // Render first to be behind the object
        >
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={layer.opacity}
            side={2} // DoubleSide
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      ))}
    </group>
  );
}

ExternalGlow.propTypes = {
  hovered: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['card', 'badge', 'light']),
};

