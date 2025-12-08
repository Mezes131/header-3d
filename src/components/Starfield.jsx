import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Color } from 'three';

const STAR_COUNT = 3000;
const STARFIELD_RADIUS = 100;
const ROTATION_SPEED = 0.0003; // Slow rotation speed

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

export default function Starfield() {
  const groupRef = useRef();

  // Generate star positions on a sphere with multiple layers for depth
  const starLayers = useMemo(() => {
    const layers = [];
    
    // Create 3 layers at different distances for depth effect
    for (let layer = 0; layer < 3; layer++) {
      const layerRadius = STARFIELD_RADIUS + layer * 10;
      const layerStarCount = Math.floor(STAR_COUNT / 3);
      const pos = new Float32Array(layerStarCount * 3);
      const colors = new Float32Array(layerStarCount * 3);

      for (let i = 0; i < layerStarCount; i++) {
        const i3 = i * 3;
        
        // Generate random position on sphere surface
        const theta = Math.random() * Math.PI * 2; // Azimuth angle
        const phi = Math.acos(randomInRange(-1, 1)); // Polar angle
        const radius = layerRadius + randomInRange(-3, 3); // Slight variation in distance
        
        pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
        pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        pos[i3 + 2] = radius * Math.cos(phi);
        
        // Vary star colors (white, blue, yellow)
        const colorChoice = Math.random();
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

  return (
    <group ref={groupRef}>
      {starLayers.map((layer, index) => {
        const geometry = useMemo(() => {
          const geom = new BufferGeometry();
          geom.setAttribute('position', new Float32BufferAttribute(layer.positions, 3));
          geom.setAttribute('color', new Float32BufferAttribute(layer.colors, 3));
          return geom;
        }, [layer]);

        return (
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
        );
      })}
    </group>
  );
}

