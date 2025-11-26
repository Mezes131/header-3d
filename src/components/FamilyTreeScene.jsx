import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import PersonCard from './PersonCard';
import RelationshipLink from './RelationshipLink';
import HeartBadge from './HeartBadge';
import Floor from './Floor';
import StreetLight from './StreetLight';
import BrickWall from './BrickWall';
import { people, links } from '../data/family';
import { CAMERA_CONFIG, CONTROLS_CONFIG, HEART_CENTER } from '../constants/layout';

function SceneContents() {
  return (
    <>
      <color attach="background" args={['#111530']} />
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.4} />

      {/* Décor de la scène */}
      <Floor />
      <StreetLight />
      
      {/* Murs de brique */}
      {/* Mur arrière */}
      <BrickWall
        position={[0, -4.1, -10]}
        rotation={[0, 0, 0]}
        width={20}
      />
      {/* Mur droit */}
      <BrickWall
        position={[10, -4.1, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={20}
      />

      {/* Arbre généalogique */}
      <group>
        {people.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
        {links.map((link) => (
          <RelationshipLink key={link.id} start={link.start} end={link.end} />
        ))}
        <HeartBadge position={HEART_CENTER} />
      </group>

      <ContactShadows
        position={[0, -2.59, 0]}
        opacity={0.35}
        width={10}
        height={10}
        blur={2}
        far={4}
      />
    </>
  );
}

export default function FamilyTreeScene() {
  return (
    <Canvas camera={CAMERA_CONFIG} shadows>
      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>
      <OrbitControls {...CONTROLS_CONFIG} />
    </Canvas>
  );
}

