import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Shape, ShapeGeometry, ExtrudeGeometry, DoubleSide } from 'three';
import {
  HEART_BADGE_RADIUS,
  HEART_BADGE_DEPTH,
  HEART_BADGE_BORDER,
  HEART_BADGE_FACE_INSET,
} from '../constants/layout';

export default function HeartBadge({ position, onHoverChange }) {
  const adjustedPosition = position;
  // Scale factor doublé
  const scale = 0.6;
  
  // Dimensions du cœur
  const heartWidth = 1.8;
  const heartHalfWidth = heartWidth / 2; 
  
  // Scale pour réduire les cœurs de moitié
  const heartScale = 0.5;
  
  // Calcul du centre pour centrer les cœurs dans la box
  // On décale vers la gauche pour centrer
  const centerOffsetX = -(heartHalfWidth * heartScale + 0.08 * heartScale) / 2;
  
  // Centre vertical
  const centerOffsetY = -((1.3 + (-0.05)) / 2) * heartScale;
  
  const createCircleShape = (radius) => {
    const shape = new Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    return shape;
  };

  // Fonction pour créer la forme de cœur
  const createHeartShape = (offsetX = 0, offsetY = 0) => {
    const x = offsetX;
    const y = offsetY;
    const heartShape = new Shape();

    // Forme de cœur réduite et centrée
    heartShape.moveTo(x + 0, y + 0.25);
    heartShape.bezierCurveTo(x + 0, y + 0.25, x - 0.3, y - 0.05, x - 0.6, y + 0.25);
    heartShape.bezierCurveTo(x - 0.9, y + 0.5, x - 0.65, y + 1.0, x, y + 1.3);
    heartShape.bezierCurveTo(x + 0.65, y + 1.0, x + 0.9, y + 0.5, x + 0.6, y + 0.25);
    heartShape.bezierCurveTo(x + 0.3, y - 0.05, x + 0, y + 0.25, x + 0, y + 0.25);

    return heartShape;
  };

  // Géométrie pour le premier cœur (rose)
  const heart1Geometry = useMemo(() => {
    const heartShape = createHeartShape();
    return new ShapeGeometry(heartShape, 64);
  }, []);

  // Géométrie pour le deuxième cœur (rouge, légèrement décalé)
  const heart2Geometry = useMemo(() => {
    const heartShape = createHeartShape(0.08, 0.05);
    return new ShapeGeometry(heartShape, 64);
  }, []);

  // Shell circulaire avec bordure (équivalent RoundedBox)
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

  // Faces avant/arrière
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
        if (onHoverChange) onHoverChange(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (onHoverChange) onHoverChange(false);
      }}
    >
      {/* Shell circulaire (bordure épaisse) */}
      <mesh geometry={shellGeometry} castShadow>
        <meshStandardMaterial color="#ff4fa3" metalness={0.35} roughness={0.4} side={DoubleSide} />
      </mesh>

      {/* Face avant */}
      <mesh geometry={faceGeometry} position={[0, 0, frontFaceZ]} castShadow>
        <meshStandardMaterial color="#ffffff" metalness={0.08} roughness={0.25} side={DoubleSide} />
      </mesh>

      {/* Face arrière */}
      <mesh geometry={faceGeometry} position={[0, 0, backFaceZ]} rotation={[0, Math.PI, 0]} castShadow>
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.35} side={DoubleSide} />
      </mesh>

      {/* Premier cœur (rouge) */}
      <mesh 
        geometry={heart1Geometry} 
        position={[ 0.08 * heartScale + centerOffsetX, centerOffsetY, heartsZ]}
        scale={heartScale}
        castShadow
      >
        <meshStandardMaterial color="#ff9ec5" metalness={0.2} roughness={0.2} side={DoubleSide} />
      </mesh>

      {/* Deuxième cœur (rose) */}
      <mesh 
        geometry={heart2Geometry} 
        position={[heartHalfWidth * heartScale + centerOffsetX, centerOffsetY, heartsZ + 0.003]}
        scale={heartScale}
        castShadow
      >
        <meshStandardMaterial color="#ff4f7a" metalness={0.2} roughness={0.2} side={DoubleSide} />
      </mesh>
    </group>
  );
}

HeartBadge.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onHoverChange: PropTypes.func,
};

