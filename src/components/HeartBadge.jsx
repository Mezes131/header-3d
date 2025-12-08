import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Shape, ShapeGeometry, ExtrudeGeometry, DoubleSide } from 'three';
import {
  HEART_BADGE_RADIUS,
  HEART_BADGE_DEPTH,
  HEART_BADGE_BORDER,
  HEART_BADGE_FACE_INSET,
} from '../constants/layout';
import ExternalGlow from './ExternalGlow';

export default function HeartBadge({ position, onHoverChange }) {
  const [hovered, setHovered] = useState(false);
  const adjustedPosition = position;
  // Doubled scale factor
  const scale = 0.6;
  
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
      position={adjustedPosition}
      scale={3 * scale / 4}
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
};

