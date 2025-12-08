import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import PersonCard from './PersonCard';
import RelationshipLink from './RelationshipLink';
import HeartBadge from './HeartBadge';
import Floor from './Floor';
import StreetLight from './StreetLight';
import BrickWall from './BrickWall';
//import WindParticles from './WindParticles';
import BounceAnimator from './BounceAnimator';
import SceneStatusText from './SceneStatusText';
import CardView from './CardView';
import Starfield from './Starfield';
import { people, links } from '../data/family';
import { CAMERA_CONFIG, CONTROLS_CONFIG, HEART_CENTER } from '../constants/layout';

// Component to animate the camera
function CameraController({ selectedPerson, isClosing, controlsRef }) {
  const { camera } = useThree();
  const cameraRef = useRef(camera);
  const isAnimatingRef = useRef(false);

  // Update camera ref when camera changes
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    if (selectedPerson && !isClosing) {
      // Opening animation
      isAnimatingRef.current = true;
      
      // Disable controls during animation
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    } else if (isClosing) {
      // Closing animation - start immediately
      isAnimatingRef.current = true;
      
      // Disable controls during animation
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    }
  }, [selectedPerson, isClosing, controlsRef]);

  useFrame(() => {
    if (!isAnimatingRef.current) return;

    const lerpFactor = 0.08;
    const cam = cameraRef.current;
    
    if (selectedPerson && !isClosing) {
      // Opening animation: zoom on CardView
      const targetPosition = [0, 2.5, 8];
      const targetTarget = [0, 2, 3];
      
      cam.position.x += (targetPosition[0] - cam.position.x) * lerpFactor;
      cam.position.y += (targetPosition[1] - cam.position.y) * lerpFactor;
      cam.position.z += (targetPosition[2] - cam.position.z) * lerpFactor;
      
      if (controlsRef.current) {
        controlsRef.current.target.x += (targetTarget[0] - controlsRef.current.target.x) * lerpFactor;
        controlsRef.current.target.y += (targetTarget[1] - controlsRef.current.target.y) * lerpFactor;
        controlsRef.current.target.z += (targetTarget[2] - controlsRef.current.target.z) * lerpFactor;
        controlsRef.current.update();
      }
      
      // Check if animation is finished
      const distance = Math.sqrt(
        Math.pow(targetPosition[0] - cam.position.x, 2) +
        Math.pow(targetPosition[1] - cam.position.y, 2) +
        Math.pow(targetPosition[2] - cam.position.z, 2)
      );
      if (distance < 0.05) {
        isAnimatingRef.current = false;
        // Re-enable controls after animation
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
    } else if (isClosing || !selectedPerson) {
      // Closing animation: return to initial position
      const targetPosition = CAMERA_CONFIG.position;
      const targetTarget = CONTROLS_CONFIG.target;
      
      cam.position.x += (targetPosition[0] - cam.position.x) * lerpFactor;
      cam.position.y += (targetPosition[1] - cam.position.y) * lerpFactor;
      cam.position.z += (targetPosition[2] - cam.position.z) * lerpFactor;
      
      if (controlsRef.current) {
        controlsRef.current.target.x += (targetTarget[0] - controlsRef.current.target.x) * lerpFactor;
        controlsRef.current.target.y += (targetTarget[1] - controlsRef.current.target.y) * lerpFactor;
        controlsRef.current.target.z += (targetTarget[2] - controlsRef.current.target.z) * lerpFactor;
        controlsRef.current.update();
      }
      
      // Check if animation is finished
      const distance = Math.sqrt(
        Math.pow(targetPosition[0] - cam.position.x, 2) +
        Math.pow(targetPosition[1] - cam.position.y, 2) +
        Math.pow(targetPosition[2] - cam.position.z, 2)
      );
      if (distance < 0.05) {
        isAnimatingRef.current = false;
        // Re-enable controls after animation
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
    }
  });

  return null;
}

function SceneContents({ controlsRef }) {
  const [statusText, setStatusText] = useState('Click on a family member');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // Disable zoom/unzoom when CardView is displayed
  useEffect(() => {
    if (controlsRef.current) {
      if (selectedPerson) {
        // Disable zoom/unzoom when CardView is open
        controlsRef.current.enableZoom = false;
        controlsRef.current.enableRotate = true;
        controlsRef.current.enablePan = false;
      } else {
        // Re-enable controls when CardView is closed
        controlsRef.current.enableZoom = true;
        controlsRef.current.enableRotate = true;
        controlsRef.current.enablePan = false; // enablePan is always false according to CONTROLS_CONFIG
      }
    }
  }, [selectedPerson, controlsRef]);

  const handleCardClose = () => {
    setSelectedPerson(null);
    setIsClosing(false);
  };

  const handleCardClosing = () => {
    setIsClosing(true);
  };

  return (
    <>
      <color attach="background" args={['#111530']} />
      
      {/* Starfield with slow rotation */}
      <Starfield />
      
      {/* Global ambient light without shadows */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow={false}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.3} />

      {/* Scene decoration */}
      <Floor />
      <StreetLight
        onHoverChange={(isHovered) => {
          setStatusText(isHovered ? 'Street light' : 'Click on a family member');
        }}
      />
      {/* <WindParticles /> */}

      {/* 3D status text above the scene */}
      <BounceAnimator amplitude={0.3} speed={1.8} axis="z">
        <SceneStatusText text={statusText} />
      </BounceAnimator>
      
      {/* Brick walls */}
      {/* Back wall */}
      <BrickWall
        position={[0, -4.1, -10]}
        rotation={[0, 0, 0]}
        width={20}
      />
      {/* Right wall */}
      <BrickWall
        position={[10, -4.1, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={20}
      />

      {/* Family tree */}
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
                onClick={(person) => {
                  setSelectedPerson(person);
                  setIsClosing(false);
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

      {/* CardView displayed when a person is selected */}
      {selectedPerson && (
        <CardView
          person={selectedPerson}
          onClose={handleCardClose}
          onClosing={handleCardClosing}
        />
      )}

      {/* Camera controller for animation */}
      <CameraController selectedPerson={selectedPerson} isClosing={isClosing} controlsRef={controlsRef} />

    </>
  );
}

export default function FamilyTreeScene() {
  const controlsRef = useRef();

  return (
    <Canvas camera={CAMERA_CONFIG} shadows>
      <Suspense fallback={null}>
        <SceneContents controlsRef={controlsRef} />
      </Suspense>
      <OrbitControls 
        ref={controlsRef}
        {...CONTROLS_CONFIG}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </Canvas>
  );
}

