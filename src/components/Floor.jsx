import { useMemo } from 'react';
import { CanvasTexture, RepeatWrapping } from 'three';

const FLOOR_SIZE = 20;
const FLOOR_Y = -4.6;
const FLOOR_THICKNESS = 0.2; // Épaisseur du sol pour le rendre 3D
const FLOOR_TILE_REPEAT = 8;

export default function Floor() {
  // Création d'une texture de sol avec un motif de grille
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fond principal avec dégradé subtil
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#fffaf3');
    gradient.addColorStop(1, '#fffaff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Motif de grille subtil
    ctx.strokeStyle = '#2d3450';
    ctx.lineWidth = 1.5;
    
    const gridSize = 64;
    for (let x = 0; x <= 512; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    
    for (let y = 0; y <= 512; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(FLOOR_TILE_REPEAT, FLOOR_TILE_REPEAT);
    texture.needsUpdate = true;
    
    return texture;
  }, []);

  return (
    <mesh 
      rotation={[-Math.PI, 0, 0]} 
      position={[0, FLOOR_Y + FLOOR_THICKNESS / 2, 0]} 
      receiveShadow
      castShadow
    >
      <boxGeometry args={[FLOOR_SIZE, FLOOR_THICKNESS, FLOOR_SIZE]} />
      <meshStandardMaterial
        map={floorTexture}
        color="#1a1f3a"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

