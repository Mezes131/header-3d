import { useMemo, useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CanvasTexture, Shape, ShapeGeometry, ExtrudeGeometry, Float32BufferAttribute, Color } from 'three';
import avatarMale from '../assets/avatar-male.png';
import avatarFemale from '../assets/avatar-female.png';

const ID_CARD_WIDTH = 4;
const ID_CARD_HEIGHT = 2.5;
const ID_CARD_DEPTH = 0.05;
const ID_CARD_CORNER_RADIUS = 0.15;
const FACE_INSET = 0.01;
const SHELL_FRAME_THICKNESS = 0.03;

const genderPalette = {
  male: {
    background: ['#ffffff', '#f8f9ff'],
    accent: '#2c7bff',
    border: '#2c7bff',
  },
  female: {
    background: ['#ffffff', '#fff8fc'],
    accent: '#ff4fa3',
    border: '#ff4fa3',
  },
};

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
  const outer = createRoundedRectShape(ID_CARD_WIDTH, ID_CARD_HEIGHT, ID_CARD_CORNER_RADIUS);
  const innerWidth = ID_CARD_WIDTH - SHELL_FRAME_THICKNESS * 2;
  const innerHeight = ID_CARD_HEIGHT - SHELL_FRAME_THICKNESS * 2;
  const innerRadius = Math.max(ID_CARD_CORNER_RADIUS - 0.01, 0.01);
  const inner = createRoundedRectShape(innerWidth, innerHeight, innerRadius);
  outer.holes.push(inner);

  const geometry = new ExtrudeGeometry(outer, { depth: ID_CARD_DEPTH, bevelEnabled: false, steps: 1 });
  geometry.translate(0, 0, -ID_CARD_DEPTH / 2);
  return geometry;
}

// Create the identity card texture
function createIdCardTexture(person, avatarImage, isButtonHovered = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  const [start, end] = genderPalette[person.gender].background;
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rounded border
  const borderRadius = 30;
  ctx.strokeStyle = genderPalette[person.gender].border;
  ctx.lineWidth = 8;

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

  // Avatar area (left side)
  const avatarSize = 200;
  const avatarX = 60;
  const avatarY = (canvas.height - avatarSize) / 2 - 50;
  const avatarRadius = 20; // Corner radius
  const padding = 10; // Padding around the avatar

  // Rounded rectangular background for the avatar
  ctx.fillStyle = genderPalette[person.gender].accent;
  ctx.beginPath();
  ctx.roundRect(avatarX - padding, avatarY - padding, avatarSize + padding * 2, avatarSize + padding * 2, avatarRadius);
  ctx.fill();

  // Draw the avatar if available
  if (avatarImage) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, avatarRadius);
    ctx.clip();
    ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  }

  // Text area (right side)
  const textX = avatarX + avatarSize + 60;
  const textY = 120;

  // Title "IDENTITY"
  ctx.fillStyle = genderPalette[person.gender].accent;
  ctx.font = 'bold 32px "Poppins", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('IDENTITY', textX, textY);

  // Separator line
  ctx.strokeStyle = genderPalette[person.gender].accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(textX, textY + 15);
  ctx.lineTo(textX + 300, textY + 15);
  ctx.stroke();

  // First name
  ctx.fillStyle = '#10152d';
  ctx.font = 'bold 36px "Poppins", "Segoe UI", sans-serif';
  ctx.fillText('First Name:', textX, textY + 100);
  ctx.font = '500 32px "Poppins", "Segoe UI", sans-serif';
  ctx.fillStyle = '#2d3450';
  ctx.fillText(person.firstName, textX + 220, textY + 100);

  // Nom
  ctx.fillStyle = '#10152d';
  ctx.font = 'bold 36px "Poppins", "Segoe UI", sans-serif';
  ctx.fillText('LastName:', textX, textY + 170);
  ctx.font = '500 32px "Poppins", "Segoe UI", sans-serif';
  ctx.fillStyle = '#2d3450';
  ctx.fillText(person.lastName, textX + 220, textY + 170);

  // Date de naissance
  ctx.fillStyle = '#10152d';
  ctx.font = 'bold 36px "Poppins", "Segoe UI", sans-serif';
  ctx.fillText('Date of Birth:', textX, textY + 240);
  ctx.font = '500 32px "Poppins", "Segoe UI", sans-serif';
  ctx.fillStyle = '#2d3450';
  ctx.fillText(person.birthDate, textX + 250, textY + 240);

  // Generation badge (top right corner)
  const badgeX = canvas.width - 720;
  const badgeY = 350;
  const badgeWidth = 150;
  const badgeHeight = 50;

  ctx.fillStyle = genderPalette[person.gender].accent;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 25);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Poppins", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Gen. ${person.generation}`, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 10);

  // Close button (cross) at top right corner
  const closeButtonSize = 50;
  const closeButtonX = canvas.width - closeButtonSize - 30;
  const closeButtonY = 30;
  const closeButtonRadius = closeButtonSize / 2;
  const crossSize = 20;
  const crossThickness = 4;

  // Button color: brighter on hover
  let buttonColor = genderPalette[person.gender].accent;
  if (isButtonHovered) {
    // Brighter color: increase brightness
    if (person.gender === 'male') {
      buttonColor = '#4a9aff'; // Lighter than #2c7bff
    } else {
      buttonColor = '#ff6bb8'; // Lighter than #ff4fa3
    }
  }

  // Button background circle
  ctx.fillStyle = buttonColor;
  ctx.beginPath();
  ctx.arc(closeButtonX + closeButtonRadius, closeButtonY + closeButtonRadius, closeButtonRadius, 0, Math.PI * 2);
  ctx.fill();

  // Drop shadow for depth effect
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Draw the cross
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = crossThickness;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'transparent'; // Reset shadow for the cross
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  const centerX = closeButtonX + closeButtonRadius;
  const centerY = closeButtonY + closeButtonRadius;
  const halfCross = crossSize / 2;

  ctx.beginPath();
  // Diagonal line from top-left to bottom-right
  ctx.moveTo(centerX - halfCross, centerY - halfCross);
  ctx.lineTo(centerX + halfCross, centerY + halfCross);
  // Diagonal line from top-right to bottom-left
  ctx.moveTo(centerX + halfCross, centerY - halfCross);
  ctx.lineTo(centerX - halfCross, centerY + halfCross);
  ctx.stroke();

  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export default function CardView({ person, onClose, onClosing }) {
  const groupRef = useRef();
  const shellMaterialRef = useRef();
  const prevPersonIdRef = useRef(person.id);
  const [mounted, setMounted] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [avatarImage, setAvatarImage] = useState(null);
  const [buttonHovered, setButtonHovered] = useState(false);

  // Load avatar asynchronously
  useEffect(() => {
    const avatarPath = person.gender === 'male' 
      ? avatarMale 
      : avatarFemale;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setAvatarImage(img);
    };
    img.onerror = () => {
      console.warn('Failed to load avatar image');
    };
    img.src = avatarPath;
  }, [person.gender]);

  // Reset mounted state when person changes
  useEffect(() => {
    if (prevPersonIdRef.current !== person.id) {
      prevPersonIdRef.current = person.id;
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        setMounted(true);
        setIsClosing(false);
      }, 0);
    }
  }, [person.id]);

  const faceTexture = useMemo(() => createIdCardTexture(person, avatarImage, buttonHovered), [person, avatarImage, buttonHovered]);
  const emissive = useMemo(
    () => new Color(person.gender === 'male' ? '#9fbfff' : '#ffc1df'),
    [person.gender],
  );

  // Function to close with animation
  const handleClose = () => {
    setIsClosing(true);
    // Immediately inform parent that closing starts (to synchronize camera)
    if (onClosing) onClosing();
    // With lerpFactor 0.15, animation takes approximately 500-600ms to reach scale 0.1
    setTimeout(() => {
      if (onClose) onClose();
    }, 200);
  };

  // Position, scale and rotation animation
  useFrame(() => {
    if (!groupRef.current) return;

    if (isClosing) {
      // Closing animation: zoom out and return to initial position
      const targetScale = 0.1;
      const targetY = 0;
      const targetZ = 0;
      const targetRotation = 0;

      const lerpFactor = 0.15;
      
      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * lerpFactor;
      groupRef.current.scale.set(newScale, newScale, newScale);

      const currentY = groupRef.current.position.y;
      const newY = currentY + (targetY - currentY) * lerpFactor;
      groupRef.current.position.y = newY;

      const currentZ = groupRef.current.position.z;
      const newZ = currentZ + (targetZ - currentZ) * lerpFactor;
      groupRef.current.position.z = newZ;

      const currentRotation = groupRef.current.rotation.y;
      const newRotation = currentRotation + (targetRotation - currentRotation) * lerpFactor;
      groupRef.current.rotation.y = newRotation;
    } else if (mounted) {
      // Opening animation: zoom in from very small
      const targetScale = 1;
      const targetY = 2;
      const targetZ = 3;
      const targetRotation = 0;

      const lerpFactor = 0.12;
    
    const currentScale = groupRef.current.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * lerpFactor;
    groupRef.current.scale.set(newScale, newScale, newScale);

    const currentY = groupRef.current.position.y;
    const newY = currentY + (targetY - currentY) * lerpFactor;
    groupRef.current.position.y = newY;

    const currentZ = groupRef.current.position.z;
    const newZ = currentZ + (targetZ - currentZ) * lerpFactor;
    groupRef.current.position.z = newZ;

      const currentRotation = groupRef.current.rotation.y;
      const newRotation = currentRotation + (targetRotation - currentRotation) * lerpFactor;
      groupRef.current.rotation.y = newRotation;
    }
  });

  // Face geometry
  const faceGeometry = useMemo(() => {
    const width = ID_CARD_WIDTH;
    const height = ID_CARD_HEIGHT;
    const radius = Math.min(ID_CARD_CORNER_RADIUS, Math.min(width, height) / 2 - 0.01);
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

  return (
    <group 
      ref={groupRef}
      position={[0, 0, 0]}
      scale={0.1}
      rotation={[0, Math.PI * 0.1, 0]}
    >
      {/* Shell (bordure) */}
      <mesh
        geometry={shellGeometry}
        castShadow
      >
        <meshStandardMaterial
          ref={shellMaterialRef}
          color={genderPalette[person.gender].accent}
          roughness={0.4}
          metalness={0.1}
          emissive={emissive}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Face avant avec texture */}
      <mesh
        geometry={faceGeometry}
        position={[0, 0, ID_CARD_DEPTH / 2 - FACE_INSET]}
        castShadow
      >
        <meshStandardMaterial
          map={faceTexture}
          roughness={0.2}
          metalness={0.05}
          transparent
        />
      </mesh>

      {/* Invisible close button (top right corner) */}
      <mesh
        position={[
          ID_CARD_WIDTH / 2 - 0.25 - 0.05, 
          ID_CARD_HEIGHT / 2 - 0.25 - 0.05, 
          ID_CARD_DEPTH / 2 - FACE_INSET //- 0.0001 
        ]}
        renderOrder={-1}
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setButtonHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setButtonHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[0.25, 0.25]} />
        <meshBasicMaterial 
          transparent 
          opacity={0} 
          depthWrite={false}
          depthTest={false}
          side={0}
        />
      </mesh>

      {/* Back face */}
      <mesh
        geometry={faceGeometry}
        position={[0, 0, -ID_CARD_DEPTH / 2 + FACE_INSET]}
        rotation={[0, Math.PI, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={genderPalette[person.gender].accent}
          roughness={0.4}
          metalness={0.1}
          emissive={emissive}
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
}

CardView.propTypes = {
  person: PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    birthDate: PropTypes.string.isRequired,
    gender: PropTypes.oneOf(['male', 'female']).isRequired,
    generation: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func,
  onClosing: PropTypes.func,
};
