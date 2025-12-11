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
import NarrativeText from './NarrativeText';
import CardView from './CardView';
import Starfield from './Starfield';
import NarrativeSequenceController, { useNarrativeSequence, SEQUENCE_STATES } from './NarrativeSequenceController';
import { people, links } from '../data/family';
import { CAMERA_CONFIG, CONTROLS_CONFIG, HEART_CENTER } from '../constants/layout';
import { NARRATIVE_TEXTS, DEFAULT_TEXT, INTRO_PHRASE_DURATION } from '../data/narrativeTexts';

// Component to animate the camera
function CameraController({ selectedPerson, isClosing, controlsRef }) {
  const { camera } = useThree();
  const cameraRef = useRef(camera);
  const isAnimatingRef = useRef(false);
  const introAnimationDoneRef = useRef(false);
  const introStartTimeRef = useRef(null);
  const currentPhraseIndexRef = useRef(-1);
  const phraseStartTimeRef = useRef(null);
  
  const { sequenceState, elapsedTime, introPhraseIndex } = useNarrativeSequence();

  // Update camera ref when camera changes
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Initialize intro animation timing
  useEffect(() => {
    if (sequenceState === SEQUENCE_STATES.INTRO && !introStartTimeRef.current) {
      introStartTimeRef.current = Date.now();
      introAnimationDoneRef.current = false;
      isAnimatingRef.current = true;
      currentPhraseIndexRef.current = -1;
      
      // Start with camera looking at empty corner (towards stars)
      // Position camera to look at top-right corner (empty area)
      const initialTarget = [8, 5, -8]; // Top-right corner, elevated
      if (controlsRef.current) {
        controlsRef.current.target.set(initialTarget[0], initialTarget[1], initialTarget[2]);
        controlsRef.current.enabled = false;
        controlsRef.current.update();
      }
      
      // Position camera to look towards the stars
      const initialPosition = [-5, 4, 15]; // Offset position looking towards corner
      cameraRef.current.position.set(initialPosition[0], initialPosition[1], initialPosition[2]);
    }
  }, [sequenceState, controlsRef]);

  // Handle phrase changes for camera movement
  useEffect(() => {
    if (sequenceState === SEQUENCE_STATES.INTRO && introPhraseIndex !== undefined && introPhraseIndex !== currentPhraseIndexRef.current) {
      currentPhraseIndexRef.current = introPhraseIndex;
      phraseStartTimeRef.current = Date.now();
    }
  }, [sequenceState, introPhraseIndex]);

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
    const lerpFactor = 0.05; // Slower, smoother movement for intro
    const cam = cameraRef.current;
    
    // Act 1: Intro camera animation with phrase-based movements
    if (sequenceState === SEQUENCE_STATES.INTRO && !introAnimationDoneRef.current && introStartTimeRef.current) {
      const introElapsed = Date.now() - introStartTimeRef.current;
      const introDuration = 9000; // 9 seconds total (3 phrases × 3 seconds)
      
      if (introElapsed < introDuration) {
        // Define camera positions for each phrase
        // Each phrase gets a smooth camera movement
        const phraseIndex = introPhraseIndex || 0;
        const phraseElapsed = phraseStartTimeRef.current ? Date.now() - phraseStartTimeRef.current : 0;
        const phraseDuration = 3000; // 3 seconds per phrase
        
        // Camera positions for each phrase (smooth transitions)
        let targetPosition, targetTarget;
        
        switch (phraseIndex) {
          case 0: // First phrase: "Every family has a story to tell..."
            // Start from corner (stars), slowly move towards center
            targetPosition = [-3, 3, 18];
            targetTarget = [4, 2, -4];
            break;
          case 1: // Second phrase: "A legacy woven through generations..."
            // Move to center-left, looking at scene
            targetPosition = [-2, 1, 19];
            targetTarget = [0, 0.5, 0];
            break;
          case 2: // Third phrase: "Where memories become legends..."
            // Move to final position, ready for reveal
            targetPosition = CAMERA_CONFIG.position;
            targetTarget = CONTROLS_CONFIG.target;
            break;
          default:
            targetPosition = CAMERA_CONFIG.position;
            targetTarget = CONTROLS_CONFIG.target;
        }
        
        // Smooth camera movement for current phrase
        cam.position.x += (targetPosition[0] - cam.position.x) * lerpFactor;
        cam.position.y += (targetPosition[1] - cam.position.y) * lerpFactor;
        cam.position.z += (targetPosition[2] - cam.position.z) * lerpFactor;
        
        if (controlsRef.current) {
          controlsRef.current.target.x += (targetTarget[0] - controlsRef.current.target.x) * lerpFactor;
          controlsRef.current.target.y += (targetTarget[1] - controlsRef.current.target.y) * lerpFactor;
          controlsRef.current.target.z += (targetTarget[2] - controlsRef.current.target.z) * lerpFactor;
          controlsRef.current.update();
        }
      } else {
        // Intro animation complete
        introAnimationDoneRef.current = true;
        isAnimatingRef.current = false;
        
        // Ensure final position
        cam.position.set(CAMERA_CONFIG.position[0], CAMERA_CONFIG.position[1], CAMERA_CONFIG.position[2]);
        if (controlsRef.current) {
          controlsRef.current.target.set(CONTROLS_CONFIG.target[0], CONTROLS_CONFIG.target[1], CONTROLS_CONFIG.target[2]);
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }
      }
      
      return;
    }
    
    if (!isAnimatingRef.current) return;
    
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
  const [statusText, setStatusText] = useState(Array.isArray(NARRATIVE_TEXTS.intro) ? NARRATIVE_TEXTS.intro[0] : NARRATIVE_TEXTS.intro);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const narrativeContext = useNarrativeSequence();
  const { sequenceState, transitionTo, elapsedTime, introPhraseIndex } = narrativeContext || {};
  
  // Debug logs
  useEffect(() => {
    //console.log('[SceneContents] Mounted - narrativeContext available:', !!narrativeContext);
    //console.log('[SceneContents] Initial sequenceState:', sequenceState, 'elapsedTime:', elapsedTime);
  }, []);
  
  useEffect(() => {
    //console.log('[SceneContents] sequenceState changed:', sequenceState, 'elapsedTime:', elapsedTime);
  }, [sequenceState, elapsedTime]);
  
  // Update narrative text based on sequence state
  useEffect(() => {
    if (sequenceState === SEQUENCE_STATES.INTRO) {
      // Handle intro phrases array
      if (Array.isArray(NARRATIVE_TEXTS.intro)) {
        const phraseIndex = introPhraseIndex || 0;
        if (phraseIndex < NARRATIVE_TEXTS.intro.length) {
          setStatusText(NARRATIVE_TEXTS.intro[phraseIndex]);
        }
      } else {
        setStatusText(NARRATIVE_TEXTS.intro);
      }
    } else if (sequenceState === SEQUENCE_STATES.REVEAL) {
      setStatusText(NARRATIVE_TEXTS.reveal);
    } else if (sequenceState === SEQUENCE_STATES.INTERACTION) {
      setStatusText(NARRATIVE_TEXTS.interaction);
    } else if (sequenceState === SEQUENCE_STATES.DISCOVERY) {
      setStatusText(NARRATIVE_TEXTS.discovery);
    } else if (sequenceState === SEQUENCE_STATES.CONCLUSION) {
      setStatusText(NARRATIVE_TEXTS.conclusion);
    }
  }, [sequenceState, introPhraseIndex]);
  
  // Transition to discovery when a person is selected
  useEffect(() => {
    if (selectedPerson && sequenceState !== SEQUENCE_STATES.DISCOVERY) {
      transitionTo(SEQUENCE_STATES.DISCOVERY);
    } else if (!selectedPerson && sequenceState === SEQUENCE_STATES.DISCOVERY) {
      // Return to interaction state when card is closed
      transitionTo(SEQUENCE_STATES.INTERACTION);
    }
  }, [selectedPerson, sequenceState, transitionTo]);

  // Disable zoom/unzoom when CardView is displayed
  useEffect(() => {
    if (controlsRef.current) {
      if (selectedPerson) {
        // Disable zoom/unzoom when CardView is open
        controlsRef.current.enableZoom = false;
        controlsRef.current.enableRotate = true;
        controlsRef.current.enablePan = true;
      } else {
        // Re-enable controls when CardView is closed
        controlsRef.current.enableZoom = true;
        controlsRef.current.enableRotate = true;
        controlsRef.current.enablePan = true;
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
      <color attach="background" args={['#04041a']} />
      {/* Ensure background is visible from start */}
      
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
          // Only show hover text if not in narrative sequence
          if (isHovered && sequenceState !== SEQUENCE_STATES.INTRO && sequenceState !== SEQUENCE_STATES.REVEAL) {
            setStatusText('Street light');
          } else if (!isHovered) {
            // Restore narrative text based on sequence state
            if (sequenceState === SEQUENCE_STATES.INTRO) {
              setStatusText(NARRATIVE_TEXTS.intro);
            } else if (sequenceState === SEQUENCE_STATES.REVEAL) {
              setStatusText(NARRATIVE_TEXTS.reveal);
            } else if (sequenceState === SEQUENCE_STATES.INTERACTION) {
              setStatusText(NARRATIVE_TEXTS.interaction);
            } else {
              setStatusText(DEFAULT_TEXT);
            }
          }
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
          {people.map((person, index) => {
            const label = person.generation === 0 ? 'Parent' : 'Child';
            // Sequential appearance delays: Jean (0ms), Jeanne (800ms), Junior (1600ms)
            const appearDelay = index * 800;
            return (
              <PersonCard
                key={person.id}
                person={person}
                appearDelay={appearDelay}
                sequenceState={sequenceState}
                onHoverChange={(isHovered) => {
                  // Show hover text only if not in intro/reveal sequences
                  if (isHovered && sequenceState !== SEQUENCE_STATES.INTRO && sequenceState !== SEQUENCE_STATES.REVEAL) {
                    setStatusText(label);
                  } else if (!isHovered) {
                    // Restore narrative text based on sequence state
                    if (sequenceState === SEQUENCE_STATES.INTRO) {
                      setStatusText(NARRATIVE_TEXTS.intro);
                    } else if (sequenceState === SEQUENCE_STATES.REVEAL) {
                      setStatusText(NARRATIVE_TEXTS.reveal);
                    } else if (sequenceState === SEQUENCE_STATES.INTERACTION) {
                      setStatusText(NARRATIVE_TEXTS.interaction);
                    } else {
                      setStatusText(DEFAULT_TEXT);
                    }
                  }
                }}
                onClick={(person) => {
                  setSelectedPerson(person);
                  setIsClosing(false);
                }}
              />
            );
          })}
          {links.map((link, index) => {
            // Links appear after cards, with delay: first link (1000ms), second (1800ms), third (2600ms)
            const appearDelay = 1000 + index * 800;
            return (
              <RelationshipLink 
                key={link.id} 
                start={link.start} 
                end={link.end}
                appearDelay={appearDelay}
                sequenceState={sequenceState}
                selectedPersonId={selectedPerson?.id}
              />
            );
          })}
          <BounceAnimator amplitude={0.1} speed={2} axis="y">
            <HeartBadge
              position={HEART_CENTER}
              appearDelay={2500}
              sequenceState={sequenceState}
              onHoverChange={(isHovered) => {
                // Show hover text only if not in intro/reveal sequences
                if (isHovered && sequenceState !== SEQUENCE_STATES.INTRO && sequenceState !== SEQUENCE_STATES.REVEAL) {
                  setStatusText('Spouse Relation');
                } else if (!isHovered) {
                  // Restore narrative text based on sequence state
                  if (sequenceState === SEQUENCE_STATES.INTRO) {
                    setStatusText(NARRATIVE_TEXTS.intro);
                  } else if (sequenceState === SEQUENCE_STATES.REVEAL) {
                    setStatusText(NARRATIVE_TEXTS.reveal);
                  } else if (sequenceState === SEQUENCE_STATES.INTERACTION) {
                    setStatusText(NARRATIVE_TEXTS.interaction);
                  } else {
                    setStatusText(DEFAULT_TEXT);
                  }
                }
              }}
            />
          </BounceAnimator>
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
    <>
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
      <NarrativeTextWrapper />
    </>
  );
}

// Wrapper component to access narrative context outside Canvas
function NarrativeTextWrapper() {
  const { sequenceState, introPhraseIndex } = useNarrativeSequence();
  
  const getNarrativeText = () => {
    switch (sequenceState) {
      case SEQUENCE_STATES.INTRO:
        // Handle intro phrases array
        if (Array.isArray(NARRATIVE_TEXTS.intro)) {
          const phraseIndex = introPhraseIndex || 0;
          return phraseIndex < NARRATIVE_TEXTS.intro.length ? NARRATIVE_TEXTS.intro[phraseIndex] : '';
        }
        return NARRATIVE_TEXTS.intro;
      case SEQUENCE_STATES.REVEAL:
        return NARRATIVE_TEXTS.reveal;
      case SEQUENCE_STATES.INTERACTION:
        return NARRATIVE_TEXTS.interaction;
      case SEQUENCE_STATES.DISCOVERY:
        return NARRATIVE_TEXTS.discovery;
      case SEQUENCE_STATES.CONCLUSION:
        return NARRATIVE_TEXTS.conclusion;
      default:
        return '';
    }
  };

  const narrativeText = getNarrativeText();
  
  // Only show narrative text during intro, reveal, and interaction sequences
  if (!narrativeText || (sequenceState !== SEQUENCE_STATES.INTRO && 
                         sequenceState !== SEQUENCE_STATES.REVEAL && 
                         sequenceState !== SEQUENCE_STATES.INTERACTION)) {
    return null;
  }

  return <NarrativeText text={narrativeText} />;
}

