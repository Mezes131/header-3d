import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute } from 'three';

const PARTICLE_COUNT = 500;
const WIND_SPEED = 0.02;
const WIND_DIRECTION = [0.3, 0.1, -0.2]; // Direction du vent (x, y, z)
const PARTICLE_SIZE = 0.05;
const PARTICLE_AREA = {
  x: [-8, 8],   // Zone horizontale
  y: [-4, 6],   // Zone verticale
  z: [-8, 8],   // Zone profondeur
};

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomVariation(windVariation) {
  return (Math.random() - 0.5) * windVariation;
}

export default function WindParticles() {
  const pointsRef = useRef();
  const velocitiesRef = useRef();

  // Initialisation des positions et vitesses des particules
  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Position aléatoire dans la zone définie
      pos[i3] = randomInRange(PARTICLE_AREA.x[0], PARTICLE_AREA.x[1]);
      pos[i3 + 1] = randomInRange(PARTICLE_AREA.y[0], PARTICLE_AREA.y[1]);
      pos[i3 + 2] = randomInRange(PARTICLE_AREA.z[0], PARTICLE_AREA.z[1]);
    }

    return pos;
  }, []);

  // Initialisation des vitesses des particules
  const velocities = useMemo(() => {
    const vel = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Vitesse initiale avec variation aléatoire
      const windVariation = 0.3;
      vel[i3] = WIND_DIRECTION[0] * WIND_SPEED + randomVariation(windVariation) * WIND_SPEED;
      vel[i3 + 1] = WIND_DIRECTION[1] * WIND_SPEED + randomVariation(windVariation) * WIND_SPEED;
      vel[i3 + 2] = WIND_DIRECTION[2] * WIND_SPEED + randomVariation(windVariation) * WIND_SPEED;
    }

    return vel;
  }, []);

  // Mettre à jour la ref après le rendu initial
  useLayoutEffect(() => {
    velocitiesRef.current = velocities;
  }, [velocities]);

  // Animation des particules
  useFrame((state) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array;
    const velocities = velocitiesRef.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Ajouter un mouvement sinusoïdal pour simuler les turbulences du vent
      const turbulence = 0.01;
      const waveX = Math.sin(time * 2 + i * 0.1) * turbulence;
      const waveY = Math.cos(time * 1.5 + i * 0.15) * turbulence;
      const waveZ = Math.sin(time * 1.8 + i * 0.12) * turbulence;

      // Mise à jour de la position avec le vent et les turbulences
      positions[i3] += velocities[i3] + waveX;
      positions[i3 + 1] += velocities[i3 + 1] + waveY;
      positions[i3 + 2] += velocities[i3 + 2] + waveZ;

      // Réinitialiser la particule si elle sort de la zone
      if (positions[i3] > PARTICLE_AREA.x[1]) {
        positions[i3] = PARTICLE_AREA.x[0];
        positions[i3 + 1] = randomInRange(PARTICLE_AREA.y[0], PARTICLE_AREA.y[1]);
        positions[i3 + 2] = randomInRange(PARTICLE_AREA.z[0], PARTICLE_AREA.z[1]);
      } else if (positions[i3] < PARTICLE_AREA.x[0]) {
        positions[i3] = PARTICLE_AREA.x[1];
        positions[i3 + 1] = randomInRange(PARTICLE_AREA.y[0], PARTICLE_AREA.y[1]);
        positions[i3 + 2] = randomInRange(PARTICLE_AREA.z[0], PARTICLE_AREA.z[1]);
      }

      if (positions[i3 + 1] > PARTICLE_AREA.y[1]) {
        positions[i3 + 1] = PARTICLE_AREA.y[0];
      } else if (positions[i3 + 1] < PARTICLE_AREA.y[0]) {
        positions[i3 + 1] = PARTICLE_AREA.y[1];
      }

      if (positions[i3 + 2] > PARTICLE_AREA.z[1]) {
        positions[i3 + 2] = PARTICLE_AREA.z[0];
      } else if (positions[i3 + 2] < PARTICLE_AREA.z[0]) {
        positions[i3 + 2] = PARTICLE_AREA.z[1];
      }
    }

    // Mettre à jour la géométrie
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Création de la géométrie
  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geom;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={PARTICLE_SIZE}
        sizeAttenuation={true}
        color="#00ffff"
        transparent
        opacity={0.6}
        alphaTest={0.1}
      />
    </points>
  );
}

