import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Color } from 'three';

const STAR_COUNT = 3000;
const STARFIELD_RADIUS = 100;
const ROTATION_SPEED = 0.0003; // Slow rotation speed

// Simple seeded random number generator for deterministic results
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randomInRange(min, max, seed) {
  return seededRandom(seed) * (max - min) + min;
}

export default function Starfield() {
  const groupRef = useRef();
  // Use a fixed seed value to avoid calling Math.random() during render
  const INITIAL_SEED = 12345;

  // Generate star positions on a sphere with multiple layers for depth
  const starLayers = useMemo(() => {
    const layers = [];
    let seed = INITIAL_SEED;
    
    // Create 3 layers at different distances for depth effect
    for (let layer = 0; layer < 3; layer++) {
      const layerRadius = STARFIELD_RADIUS + layer * 10;
      const layerStarCount = Math.floor(STAR_COUNT / 3);
      const pos = new Float32Array(layerStarCount * 3);
      const colors = new Float32Array(layerStarCount * 3);

      for (let i = 0; i < layerStarCount; i++) {
        const i3 = i * 3;
        seed += 1;
        
        // Generate random position on sphere surface using seeded random
        const theta = seededRandom(seed) * Math.PI * 2; // Azimuth angle
        seed += 1;
        const phi = Math.acos(randomInRange(-1, 1, seed)); // Polar angle
        seed += 1;
        const radius = layerRadius + randomInRange(-3, 3, seed); // Slight variation in distance
        
        pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
        pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        pos[i3 + 2] = radius * Math.cos(phi);
        
        // Vary star colors (white, blue, yellow) using seeded random
        seed += 1;
        const colorChoice = seededRandom(seed);
        let color;
        if (colorChoice < 0.7) {
          color = new Color(1, 1, 1); // White
        } else if (colorChoice < 0.9) {
          color = new Color(0.8, 0.9, 1); // Light blue
        } else {
          color = new Color(1, 1, 0.8); // Light yellow
        }
        
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
      }

      layers.push({ positions: pos, colors });
    }

    return layers;
  }, []);

  // Slow rotation animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED;
    }
  });

  // Create geometries for all layers
  const geometries = useMemo(() => {
    return starLayers.map((layer) => {
      const geom = new BufferGeometry();
      geom.setAttribute('position', new Float32BufferAttribute(layer.positions, 3));
      geom.setAttribute('color', new Float32BufferAttribute(layer.colors, 3));
      return geom;
    });
  }, [starLayers]);

  return (
    <group ref={groupRef}>
      {geometries.map((geometry, index) => (
        <points key={index} geometry={geometry}>
          <pointsMaterial
            size={0.3 + index * 0.1} // Small stars like tiny bright points
            sizeAttenuation={true}
            vertexColors={true}
            transparent
            opacity={0.8 + index * 0.05}
            alphaTest={0.1}
          />
        </points>
      ))}
    </group>
  );
}

