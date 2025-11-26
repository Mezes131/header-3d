import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Shape, ShapeGeometry, ExtrudeGeometry, DoubleSide } from 'three';
import { CARD_HEIGHT } from '../constants/layout';

const BADGE_RADIUS = 1.25;
const BADGE_DEPTH = 0.12;
const BORDER_THICKNESS = 0.14;
const FACE_INSET = 0.01;

export default function HeartBadge({ position }) {
  // Calcul du décalage vers le haut : moitié de la hauteur des cartes des parents
  const offsetY = CARD_HEIGHT / 2; // 3.15 / 2 = 1.575
  const adjustedPosition = [position[0], position[1] + offsetY, position[2]];
  // Scale factor doublé
  const scale = 0.6;
  
  // Dimensions du cœur
  // Largeur: de -0.9 à +0.9 = 1.8
  // Hauteur: de -0.05 à 1.3 = 1.35
  const heartWidth = 1.8;
  const heartHeight = 1.35;
  const heartHalfWidth = heartWidth / 2; // 0.9
  
  // Scale pour réduire les cœurs de moitié
  const heartScale = 0.5;
  
  // Calcul du centre pour centrer les cœurs dans la box
  // Cœur rose décalé: position X = 0.9 * 0.5 = 0.45
  // Cœur rouge: position X = 0.08 * 0.5 = 0.04 (dans la forme)
  // Centre horizontal approximatif: (0.45 + 0.04) / 2 = 0.245
  // On décale vers la gauche pour centrer
  const centerOffsetX = -(heartHalfWidth * heartScale + 0.08 * heartScale) / 2;
  
  // Centre vertical: le cœur va de y = -0.05 à y = 1.3, donc centre absolu à (-0.05 + 1.3) / 2 = 0.625
  // Pour centrer, on décale de -0.625, puis on applique le scale
  // Après scale: -0.625 * 0.5 = -0.3125
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
    const outer = createCircleShape(BADGE_RADIUS);
    const inner = createCircleShape(BADGE_RADIUS - BORDER_THICKNESS);
    outer.holes.push(inner);
    const geometry = new ExtrudeGeometry(outer, {
      depth: BADGE_DEPTH,
      bevelEnabled: false,
      steps: 1,
    });
    geometry.translate(0, 0, -BADGE_DEPTH / 2);
    return geometry;
  }, []);

  // Faces avant/arrière
  const faceGeometry = useMemo(() => {
    const faceShape = createCircleShape(BADGE_RADIUS - BORDER_THICKNESS + FACE_INSET);
    return new ShapeGeometry(faceShape, 64);
  }, []);

  const frontFaceZ = BADGE_DEPTH / 2 - FACE_INSET;
  const backFaceZ = -BADGE_DEPTH / 2 + FACE_INSET;
  const heartsZ = frontFaceZ + 0.002;

  return (
    <group position={adjustedPosition} scale={scale} rotation={[Math.PI, Math.PI, 0]}>
      {/* Shell circulaire (bordure épaisse) */}
      <mesh geometry={shellGeometry}>
        <meshStandardMaterial color="#ff4fa3" metalness={0.35} roughness={0.4} side={DoubleSide} />
      </mesh>

      {/* Face avant */}
      <mesh geometry={faceGeometry} position={[0, 0, frontFaceZ]}>
        <meshStandardMaterial color="#ffffff" metalness={0.08} roughness={0.25} side={DoubleSide} />
      </mesh>

      {/* Face arrière */}
      <mesh geometry={faceGeometry} position={[0, 0, backFaceZ]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.35} side={DoubleSide} />
      </mesh>

      {/* Premier cœur (rose, en arrière, décalé vers la droite) */}
      <mesh 
        geometry={heart1Geometry} 
        position={[heartHalfWidth * heartScale + centerOffsetX, centerOffsetY, heartsZ]}
        scale={heartScale}
      >
        <meshStandardMaterial color="#ff9ec5" metalness={0.2} roughness={0.2} side={DoubleSide} />
      </mesh>

      {/* Deuxième cœur (rouge, en avant) */}
      <mesh 
        geometry={heart2Geometry} 
        position={[0.08 * heartScale + centerOffsetX, centerOffsetY, heartsZ + 0.003]}
        scale={heartScale}
      >
        <meshStandardMaterial color="#ff4f7a" metalness={0.2} roughness={0.2} side={DoubleSide} />
      </mesh>
    </group>
  );
}

HeartBadge.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
};

