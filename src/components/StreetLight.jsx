import { useMemo, useRef, useEffect } from 'react';
import { CylinderGeometry, SphereGeometry, ConeGeometry, Object3D } from 'three';

const POLE_HEIGHT = 8;
const POLE_RADIUS = 0.08;
const LAMP_RADIUS = 0.4;
const BASE_RADIUS = 0.2;
const BASE_HEIGHT = 0.3;

// Position du lampadaire pour éclairer l'arbre généalogique
// Placé légèrement en arrière et sur le côté pour un éclairage optimal
const LIGHT_POSITION = [7, -4.6, 0.5];

// Position cible de l'arbre généalogique (centre de la scène)
const TREE_TARGET = [0, 0.3, 0];

// Couleur de la lumière (jaune chaud pour correspondre à la lampe)
const LIGHT_COLOR = '#fff8e1';

export default function StreetLight() {
  // Géométrie du poteau
  const poleGeometry = useMemo(
    () => new CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 16),
    []
  );

  // Géométrie de la base
  const baseGeometry = useMemo(
    () => new CylinderGeometry(BASE_RADIUS, BASE_RADIUS * 1.2, BASE_HEIGHT, 16),
    []
  );

  // Géométrie de la lampe (sphère)
  const lampGeometry = useMemo(() => new SphereGeometry(LAMP_RADIUS, 16, 16), []);

  // Géométrie du toit de la lampe (cône inversé)
  const lampTopGeometry = useMemo(
    () => new ConeGeometry(LAMP_RADIUS * 0.9, 0.3, 16),
    []
  );

  // Géométrie du support de la lampe
  const lampSupportGeometry = useMemo(
    () => new CylinderGeometry(0.1, 0.1, 0.2, 16),
    []
  );

  // Référence pour le spotLight
  const spotLightRef = useRef();
  const targetRef = useRef(new Object3D());

  // Position de la lampe dans l'espace local
  const lampPosition = [0, BASE_HEIGHT + POLE_HEIGHT + LAMP_RADIUS * 0.3, 0];

  // Configuration de la cible du spotLight pour pointer vers l'arbre généalogique
  useEffect(() => {
    if (spotLightRef.current) {
      // Calculer la direction vers la cible (position absolue dans la scène)
      // Le lampadaire est dans un group à LIGHT_POSITION, donc on calcule la direction relative
      const targetX = TREE_TARGET[0] - LIGHT_POSITION[0];
      const targetY = TREE_TARGET[1] - LIGHT_POSITION[1];
      const targetZ = TREE_TARGET[2] - LIGHT_POSITION[2];
      
      // Positionner la cible dans l'espace local du group
      targetRef.current.position.set(targetX, targetY, targetZ);
      spotLightRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <group position={LIGHT_POSITION}>
      {/* Base du lampadaire */}
      <mesh
        geometry={baseGeometry}
        position={[0, BASE_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#2a2f4a" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Poteau principal */}
      <mesh
        geometry={poleGeometry}
        position={[0, BASE_HEIGHT + POLE_HEIGHT / 2, 0]}
        castShadow
      >
        <meshStandardMaterial color="#3a3f5a" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Support de la lampe (petit cylindre) */}
      <mesh
        geometry={lampSupportGeometry}
        position={[0, BASE_HEIGHT + POLE_HEIGHT - 0.1, 0]}
        castShadow
      >
        <meshStandardMaterial color="#2a2f4a" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Lampe (sphère lumineuse) */}
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

      {/* Toit de la lampe */}
      <mesh
        geometry={lampTopGeometry}
        position={[0, BASE_HEIGHT + POLE_HEIGHT + LAMP_RADIUS * 0.8, 0]}
        rotation={[0, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#2a2f4a" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Lumière principale pointLight - éclairage général depuis la lampe */}
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

      {/* Lumière spotLight - éclairage directionnel vers l'arbre généalogique */}
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

      {/* Lumière supplémentaire pour éclairer le sol et créer des réflexions */}
      <pointLight
        position={[0, BASE_HEIGHT + POLE_HEIGHT + LAMP_RADIUS * 0.3, 0]}
        color={LIGHT_COLOR}
        intensity={1.5}
        distance={20}
        decay={2}
      />
    </group>
  );
}

