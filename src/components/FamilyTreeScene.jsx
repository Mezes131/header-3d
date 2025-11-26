import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import PersonCard from './PersonCard';
import RelationshipLink from './RelationshipLink';
import HeartBadge from './HeartBadge';
import Floor from './Floor';
import StreetLight from './StreetLight';
import BrickWall from './BrickWall';
import WindParticles from './WindParticles';
import BounceAnimator from './BounceAnimator';
import SceneStatusText from './SceneStatusText';
import { people, links } from '../data/family';
import { CAMERA_CONFIG, CONTROLS_CONFIG, HEART_CENTER } from '../constants/layout';

function SceneContents() {
  const [statusText, setStatusText] = useState('Click on a family member');

  return (
    <>
      <color attach="background" args={['#111530']} />
      {/* Lumière d'ambiance globale sans ombres */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow={false}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.3} />

      {/* Décor de la scène */}
      <Floor />
      <StreetLight
        onHoverChange={(isHovered) => {
          setStatusText(isHovered ? 'Street light' : 'Click on a family member');
        }}
      />
      <WindParticles />

      {/* Texte de statut 3D au-dessus de la scène */}
      <BounceAnimator amplitude={0.3} speed={1.8} axis="z">
        <SceneStatusText text={statusText} />
      </BounceAnimator>
      
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
      <BounceAnimator amplitude={0.3} speed={1.8}>
        <group>
          {people.map((person) => {
            const label = person.generation === 0 ? 'Parent' : 'Child';
            return (
              <PersonCard
                key={person.id}
                person={person}
                onHoverChange={(isHovered) => {
                  setStatusText(isHovered ? label : 'Click on a family member');
                }}
              />
            );
          })}
          {links.map((link) => (
            <RelationshipLink key={link.id} start={link.start} end={link.end} />
          ))}
          <HeartBadge
            position={HEART_CENTER}
            onHoverChange={(isHovered) => {
              setStatusText(isHovered ? 'Spouse Relation' : 'Click on a family member');
            }}
          />
        </group>
      </BounceAnimator>

    </>
  );
}

export default function FamilyTreeScene() {
  return (
    <Canvas camera={CAMERA_CONFIG} shadows>
      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>
      <OrbitControls 
        {...CONTROLS_CONFIG}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </Canvas>
  );
}

