import { useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { CanvasTexture, Color, ExtrudeGeometry, Float32BufferAttribute, Shape, ShapeGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import { CARD_DEPTH, CARD_HEIGHT, CARD_WIDTH } from '../constants/layout';

// RoundedBox takes world units, so convert the 60px design radius to scene space.
const CARD_CORNER_RADIUS = (60 / 512) * CARD_WIDTH;
// Keep the face radius just shy of the shell radius to avoid z-fighting.
const FACE_CORNER_RADIUS = CARD_CORNER_RADIUS - 0.01;

const FACE_INSET = 0.015;
const SHELL_FRAME_THICKNESS = 0.04;

const generationColors = {
  0: '#7a64ff',
  1: '#8c7eff',
};

const genderPalette = {
  male: {
    background: ['#f4f7ff', '#f7f9ff'],
    accent: '#2c7bff',
    icon: '#ffffff',
    shell: '#2c7bff',
  },
  female: {
    background: ['#fff6fa', '#fff7fb'],
    accent: '#ff4fa3',
    icon: '#ffffff',
    shell: '#ff4fa3',
  },
};

// Recreates the gender glyphs on top of the colored badge.
function drawGenderIcon(ctx, gender) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  const maleCenter = { x: 256, y: 200 };
  const femaleCenter = { x: 256, y: 180 };
  const scale = 0.75;

  const scalePoint = (center, point) => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
  });

  if (gender === 'male') {
    // male symbol: circle + arrow
    ctx.beginPath();
    ctx.arc(maleCenter.x, maleCenter.y, 38 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    const maleArrowStart = scalePoint(maleCenter, { x: 284, y: 172 });
    const maleArrowEnd = scalePoint(maleCenter, { x: 308, y: 148 });
    ctx.moveTo(maleArrowStart.x, maleArrowStart.y);
    ctx.lineTo(maleArrowEnd.x, maleArrowEnd.y);
    ctx.stroke();

    ctx.beginPath();
    const maleArrowTipA = scalePoint(maleCenter, { x: 300, y: 148 });
    const maleArrowTipB = scalePoint(maleCenter, { x: 312, y: 148 });
    const maleArrowTipC = scalePoint(maleCenter, { x: 312, y: 160 });
    ctx.moveTo(maleArrowTipA.x, maleArrowTipA.y);
    ctx.lineTo(maleArrowTipB.x, maleArrowTipB.y);
    ctx.lineTo(maleArrowTipC.x, maleArrowTipC.y);
    ctx.stroke();
  } else {
    // female symbol: circle + cross
    ctx.beginPath();
    ctx.arc(femaleCenter.x, femaleCenter.y, 38 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    const femaleVerticalStart = scalePoint(femaleCenter, { x: 256, y: 218 });
    const femaleVerticalEnd = scalePoint(femaleCenter, { x: 256, y: 276 });
    const femaleHorizontalStart = scalePoint(femaleCenter, { x: 228, y: 250 });
    const femaleHorizontalEnd = scalePoint(femaleCenter, { x: 284, y: 250 });
    ctx.moveTo(femaleVerticalStart.x, femaleVerticalStart.y);
    ctx.lineTo(femaleVerticalEnd.x, femaleVerticalEnd.y);
    ctx.moveTo(femaleHorizontalStart.x, femaleHorizontalStart.y);
    ctx.lineTo(femaleHorizontalEnd.x, femaleHorizontalEnd.y);
    ctx.stroke();
  }

  ctx.restore();
}

function createRoundedRectShape(width, height, radius) {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, Math.min(hw, hh));
  const shape = new Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  shape.closePath();
  return shape;
}

function buildShellGeometry() {
  const outer = createRoundedRectShape(CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
  const innerWidth = CARD_WIDTH - SHELL_FRAME_THICKNESS * 2;
  const innerHeight = CARD_HEIGHT - SHELL_FRAME_THICKNESS * 2;
  const innerRadius = Math.max(FACE_CORNER_RADIUS - 0.005, 0.01);
  const inner = createRoundedRectShape(innerWidth, innerHeight, innerRadius);
  outer.holes.push(inner);

  const geometry = new ExtrudeGeometry(outer, { depth: CARD_DEPTH, bevelEnabled: false, steps: 1 });
  geometry.translate(0, 0, -CARD_DEPTH / 2);
  return geometry;
}

// Paints the flat 2D layout (background, texts, icons) into an offscreen texture.
function createCardTexture(person) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  // background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  const [start, end] = genderPalette[person.gender].background;
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // rounded border
  const borderRadius = 60;
  ctx.strokeStyle = person.gender === 'male' ? '#2d7bff' : '#ff4fa3';
  ctx.lineWidth = 16;

  ctx.beginPath();
  ctx.moveTo(borderRadius, 0);
  ctx.lineTo(canvas.width - borderRadius, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, borderRadius);
  ctx.lineTo(canvas.width, canvas.height - borderRadius);
  ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - borderRadius, canvas.height);
  ctx.lineTo(borderRadius, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - borderRadius);
  ctx.lineTo(0, borderRadius);
  ctx.quadraticCurveTo(0, 0, borderRadius, 0);
  ctx.closePath();
  ctx.stroke();

  // generation badge
  const badgeX = 28;
  const badgeY = 28;
  const badgeWidth = 180;
  const badgeHeight = 72;
  const badgePadding = 20;

  ctx.fillStyle = generationColors[person.generation] || '#bbb';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 36);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px "Poppins", "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(`Gen. ${person.generation}`, badgeX + badgePadding, badgeY + badgeHeight / 2);

  // gender icon bubble
  ctx.fillStyle = person.gender === 'male' ? '#2d7bff' : '#ff4fa3';
  ctx.beginPath();
  ctx.arc(256, 200, 90, 0, Math.PI * 2);
  ctx.fill();
  drawGenderIcon(ctx, person.gender);

  // text zone
  ctx.fillStyle = '#10152d';
  ctx.font = 'bold 72px "Poppins", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(person.firstName, canvas.width / 2, 420);

  ctx.font = '500 48px "Poppins", "Segoe UI", sans-serif';
  ctx.fillStyle = '#5a5f7a';
  ctx.fillText(person.lastName, canvas.width / 2, 480);

  ctx.font = '500 40px "Poppins", "Segoe UI", sans-serif';
  ctx.fillStyle = '#6e7695';
  ctx.fillText(person.birthDate, canvas.width / 2, 540);

  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export default function PersonCard({ person, onHoverChange }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();
  const backFaceRef = useRef();
  const shellMaterialRef = useRef();
  const backFaceMaterialRef = useRef();
  const emissiveIntensityRef = useRef(0);
  const backEmissiveIntensityRef = useRef(0);

  // Valeurs cibles pour l'animation
  const targetScale = hovered ? 1.04 : 1;
  const targetZ = hovered ? 0.08 : 0;
  const targetBackScale = hovered ? 1.05 : 1;
  const targetEmissiveIntensity = hovered ? 0.15 : 0;
  const targetBackEmissiveIntensity = hovered ? 0.2 : 0;

  // Animation smooth avec interpolation
  useFrame(() => {
    if (!groupRef.current || !backFaceRef.current) return;

    // Interpolation linéaire pour un mouvement fluide (lerp factor: 0.15)
    const lerpFactor = 0.15;
    
    // Animer le scale du group
    const currentScale = groupRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * lerpFactor;
    groupRef.current.scale.set(newScale, newScale, newScale);

    // Animer la position Z
    const currentZ = groupRef.current.position.z - person.position[2];
    const newZ = currentZ + (targetZ - currentZ) * lerpFactor;
    groupRef.current.position.z = person.position[2] + newZ;

    // Animer le scale de la face arrière
    const currentBackScale = backFaceRef.current.scale.x;
    const newBackScale = currentBackScale + (targetBackScale - currentBackScale) * lerpFactor;
    backFaceRef.current.scale.set(newBackScale, newBackScale, newBackScale);

    // Animer l'intensité de l'émission
    emissiveIntensityRef.current += (targetEmissiveIntensity - emissiveIntensityRef.current) * lerpFactor;
    backEmissiveIntensityRef.current += (targetBackEmissiveIntensity - backEmissiveIntensityRef.current) * lerpFactor;

    // Mettre à jour les matériaux directement
    if (shellMaterialRef.current) {
      shellMaterialRef.current.emissiveIntensity = emissiveIntensityRef.current;
      if (hovered) {
        shellMaterialRef.current.emissive.copy(emissive);
      } else {
        shellMaterialRef.current.emissive.setHex(0x000000);
      }
    }
    if (backFaceMaterialRef.current) {
      backFaceMaterialRef.current.emissiveIntensity = backEmissiveIntensityRef.current;
      if (hovered) {
        backFaceMaterialRef.current.emissive.copy(emissive);
      } else {
        backFaceMaterialRef.current.emissive.setHex(0x000000);
      }
    }
  });

  const texture = useMemo(() => createCardTexture(person), [person]);
  const emissive = useMemo(
    () => new Color(person.gender === 'male' ? '#9fbfff' : '#ffc1df'),
    [person.gender],
  );
  // Precompute a rounded rectangle geometry so the textured face matches the shell outline.
  const faceGeometry = useMemo(() => {
    const width = CARD_WIDTH;
    const height = CARD_HEIGHT;
    const radius = Math.min(FACE_CORNER_RADIUS, Math.min(width, height) / 2 - 0.01);
    const shape = createRoundedRectShape(width, height, radius);
    const geometry = new ShapeGeometry(shape, 32);
    geometry.computeBoundingBox();
    const { min, max } = geometry.boundingBox;
    const scaleX = max.x - min.x || 1;
    const scaleY = max.y - min.y || 1;
    const positionAttr = geometry.attributes.position;
    const uv = new Float32Array(positionAttr.count * 2);
    for (let i = 0; i < positionAttr.count; i += 1) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      uv[i * 2] = (x - min.x) / scaleX;
      uv[i * 2 + 1] = (y - min.y) / scaleY;
    }
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    return geometry;
  }, []);

  const shellGeometry = useMemo(() => buildShellGeometry(), []);

  // Back face geometry (simple rounded rectangle, same size as front face)
  const backFaceGeometry = useMemo(() => {
    const width = CARD_WIDTH;
    const height = CARD_HEIGHT;
    const radius = Math.min(FACE_CORNER_RADIUS, Math.min(width, height) / 2 - 0.01);
    const shape = createRoundedRectShape(width, height, radius);
    return new ShapeGeometry(shape, 32);
  }, []);

  return (
    <group 
      ref={groupRef}
      position={[person.position[0], person.position[1], person.position[2]]}
      scale={1}
    >
      <mesh
        geometry={shellGeometry}
        castShadow
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
        <meshStandardMaterial
          ref={shellMaterialRef}
          color={genderPalette[person.gender].shell}
          roughness={0.4}
          metalness={0.1}
          emissive={hovered ? emissive : new Color('#000000')}
          emissiveIntensity={0}
        />
      </mesh>
      <mesh
        geometry={faceGeometry}
        position={[0, 0, CARD_DEPTH / 2 - FACE_INSET]}
        castShadow
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
        <meshStandardMaterial
          map={texture}
          roughness={0.2}
          metalness={0.05}
          transparent
        />
      </mesh>
      <mesh
        ref={backFaceRef}
        geometry={backFaceGeometry}
        position={[0, 0, -CARD_DEPTH / 2 + FACE_INSET]}
        rotation={[0, Math.PI, 0]}
        scale={1}
        castShadow
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
        <meshStandardMaterial
          ref={backFaceMaterialRef}
          color={genderPalette[person.gender].shell}
          roughness={0.4}
          metalness={0.1}
          emissive={hovered ? emissive : new Color('#000000')}
          emissiveIntensity={0}
        />
      </mesh>
      <mesh position={[0, -(CARD_HEIGHT / 2) - 0.02, 0]}>
        <planeGeometry args={[CARD_WIDTH * 0.6, 0.02]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

PersonCard.propTypes = {
  person: PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    birthDate: PropTypes.string.isRequired,
    gender: PropTypes.oneOf(['male', 'female']).isRequired,
    generation: PropTypes.number.isRequired,
    position: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired,
  onHoverChange: PropTypes.func,
};


