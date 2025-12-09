import { useMemo, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Shape, ShapeGeometry, ExtrudeGeometry, DoubleSide } from 'three';
import { useFrame } from '@react-three/fiber';
import {
  HEART_BADGE_RADIUS,
  HEART_BADGE_DEPTH,
  HEART_BADGE_BORDER,
  HEART_BADGE_FACE_INSET,
} from '../constants/layout';
import ExternalGlow from './ExternalGlow';
import BounceAnimator from './BounceAnimator';
import { useNarrativeSequence, SEQUENCE_STATES } from './NarrativeSequenceController';

export default function HeartBadge({ position, onHoverChange, appearDelay = 0, sequenceState }) {
  const [hovered, setHovered] = useState(false);
  const adjustedPosition = position;
  // Doubled scale factor
  const baseScale = 0.6;
  
  // Narrative sequence state
  const narrativeContext = useNarrativeSequence();
  const currentSequenceState = sequenceState || narrativeContext?.sequenceState || SEQUENCE_STATES.INTRO;
  const elapsedTime = narrativeContext?.elapsedTime || 0;
  
  // Appearance animation state
  const appearStartTimeRef = useRef(null);
  const appearanceScaleRef = useRef(0);
  const hasAppearedRef = useRef(false);
  const groupRef = useRef();
  
  // Initialize appearance timing
  useEffect(() => {
    if (currentSequenceState === SEQUENCE_STATES.REVEAL && appearStartTimeRef.current === null) {
      const revealStartTime = 3000; // REVEAL starts at 3s
      appearStartTimeRef.current = revealStartTime + appearDelay;
    }
    // If we're past REVEAL and haven't initialized yet, schedule appearance during REVEAL window
    // This ensures badge appears progressively even if mounted late
    else if (
      (currentSequenceState === SEQUENCE_STATES.INTERACTION || 
       currentSequenceState === SEQUENCE_STATES.DISCOVERY || 
       currentSequenceState === SEQUENCE_STATES.CONCLUSION) &&
      appearStartTimeRef.current === null &&
      !hasAppearedRef.current
    ) {
      // Schedule appearance as if it happened during REVEAL (for progressive appearance)
      const revealStartTime = 3000;
      const revealEndTime = revealStartTime + 3000; // REVEAL duration is 3s
      // Use the reveal end time minus a small delay to ensure it appears before REVEAL ends
      appearStartTimeRef.current = Math.min(revealEndTime - 200, revealStartTime + appearDelay);
    }
    // Reset when going back to INTRO (for testing/reset)
    if (currentSequenceState === SEQUENCE_STATES.INTRO) {
      appearStartTimeRef.current = null;
      hasAppearedRef.current = false;
      appearanceScaleRef.current = 0;
    }
  }, [currentSequenceState, appearDelay, elapsedTime]);

  // Calculate appearance animation progress
  const getAppearanceProgress = () => {
    // If already appeared, stay visible (even after REVEAL state)
    if (hasAppearedRef.current) {
      return 1;
    }
    
    // If timing not initialized yet, stay invisible
    if (!appearStartTimeRef.current) {
      return 0;
    }
    
    const appearanceStart = appearStartTimeRef.current;
    const appearanceDuration = 1000; // 1 second for appearance animation
    
    // If we're past the appearance time, appear
    if (elapsedTime >= appearanceStart) {
      const progress = Math.min((elapsedTime - appearanceStart) / appearanceDuration, 1);
      
      // Mark as appeared when animation completes
      if (progress >= 1) {
        hasAppearedRef.current = true;
        return 1;
      }
      
      // Scale animation: 0 → 1.1 → 1.0
      if (progress < 0.5) {
        // First half: scale from 0 to 1.1
        return (progress / 0.5) * 1.1;
      } else {
        // Second half: scale from 1.1 to 1.0
        return 1.1 - ((progress - 0.5) / 0.5) * 0.1;
      }
    }
    
    // Still waiting for appearance time
    return 0;
  };

  // Animate appearance scale
  useFrame(() => {
    if (groupRef.current) {
      const targetScale = getAppearanceProgress();
      const lerpFactor = 0.15;
      appearanceScaleRef.current += (targetScale - appearanceScaleRef.current) * lerpFactor;
      groupRef.current.scale.setScalar(appearanceScaleRef.current * baseScale);
    }
  });
  
  const scale = appearanceScaleRef.current * baseScale;
  
  // Heart dimensions
  const heartWidth = 1.8;
  const heartHalfWidth = heartWidth / 2; 
  
  // Scale to reduce hearts by half
  const heartScale = 0.5;
  
  // Calculate center to center hearts in the box
  // Shift left to center
  const centerOffsetX = -(heartHalfWidth * heartScale + 0.08 * heartScale) / 2;
  
  // Vertical center
  const centerOffsetY = -((1.3 + (-0.05)) / 2) * heartScale;
  
  const createCircleShape = (radius) => {
    const shape = new Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    return shape;
  };

  // Function to create heart shape
  const createHeartShape = (offsetX = 0, offsetY = 0) => {
    const x = offsetX;
    const y = offsetY;
    const heartShape = new Shape();

    // Reduced and centered heart shape
    heartShape.moveTo(x + 0, y + 0.25);
    heartShape.bezierCurveTo(x + 0, y + 0.25, x - 0.3, y - 0.05, x - 0.6, y + 0.25);
    heartShape.bezierCurveTo(x - 0.9, y + 0.5, x - 0.65, y + 1.0, x, y + 1.3);
    heartShape.bezierCurveTo(x + 0.65, y + 1.0, x + 0.9, y + 0.5, x + 0.6, y + 0.25);
    heartShape.bezierCurveTo(x + 0.3, y - 0.05, x + 0, y + 0.25, x + 0, y + 0.25);

    return heartShape;
  };

  // Geometry for first heart (pink)
  const heart1Geometry = useMemo(() => {
    const heartShape = createHeartShape();
    return new ShapeGeometry(heartShape, 64);
  }, []);

  // Geometry for second heart (red, slightly offset)
  const heart2Geometry = useMemo(() => {
    const heartShape = createHeartShape(0.08, 0.05);
    return new ShapeGeometry(heartShape, 64);
  }, []);

  // Circular shell with border (equivalent to RoundedBox)
  const shellGeometry = useMemo(() => {
    const outer = createCircleShape(HEART_BADGE_RADIUS);
    const inner = createCircleShape(HEART_BADGE_RADIUS - HEART_BADGE_BORDER);
    outer.holes.push(inner);
    const geometry = new ExtrudeGeometry(outer, {
      depth: HEART_BADGE_DEPTH,
      bevelEnabled: false,
      steps: 1,
    });
    geometry.translate(0, 0, -HEART_BADGE_DEPTH / 2);
    return geometry;
  }, []);

  // Front/back faces
  const faceGeometry = useMemo(() => {
    const faceShape = createCircleShape(HEART_BADGE_RADIUS - HEART_BADGE_BORDER + HEART_BADGE_FACE_INSET);
    return new ShapeGeometry(faceShape, 64);
  }, []);

  const frontFaceZ = HEART_BADGE_DEPTH / 2 - HEART_BADGE_FACE_INSET;
  const backFaceZ = -HEART_BADGE_DEPTH / 2 + HEART_BADGE_FACE_INSET;
  const heartsZ = frontFaceZ + 0.002;

  return (
    <group
      ref={groupRef}
      position={adjustedPosition}
      rotation={[Math.PI, Math.PI, 0]}
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
      {/* Circular shell (thick border) */}
      <mesh geometry={shellGeometry} castShadow>
        <meshStandardMaterial color="#ff4fa3" metalness={0.35} roughness={0.4} side={DoubleSide} />
      </mesh>

      {/* Front face */}
      <mesh geometry={faceGeometry} position={[0, 0, frontFaceZ]} castShadow>
        <meshStandardMaterial color="#ffffff" metalness={0.08} roughness={0.25} side={DoubleSide} />
      </mesh>

      {/* Back face */}
      <mesh geometry={faceGeometry} position={[0, 0, backFaceZ]} rotation={[0, Math.PI, 0]} castShadow>
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.35} side={DoubleSide} />
      </mesh>

      {/* First heart (red) */}
      <mesh 
        geometry={heart1Geometry} 
        position={[ 0.08 * heartScale + centerOffsetX, centerOffsetY, heartsZ]}
        scale={heartScale}
        castShadow
      >
        <meshStandardMaterial color="#ff9ec5" metalness={0.2} roughness={0.2} side={DoubleSide} />
      </mesh>

      {/* Second heart (pink) */}
      <mesh 
        geometry={heart2Geometry} 
        position={[heartHalfWidth * heartScale + centerOffsetX, centerOffsetY, heartsZ + 0.003]}
        scale={heartScale}
        castShadow
      >
        <meshStandardMaterial color="#ff4f7a" metalness={0.2} roughness={0.2} side={DoubleSide} />
      </mesh>
      <ExternalGlow hovered={hovered} type="badge" />
    </group>
  );
}

HeartBadge.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onHoverChange: PropTypes.func,
  appearDelay: PropTypes.number,
  sequenceState: PropTypes.string,
};

