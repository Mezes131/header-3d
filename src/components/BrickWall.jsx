import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { CanvasTexture, RepeatWrapping } from 'three';

const WALL_HEIGHT = 1;
const WALL_THICKNESS = 0.3;
const MORTAR_THICKNESS = 0.02;

export default function BrickWall({ position, rotation, width }) {
  // Create procedural brick texture
  const brickTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const brickPatternWidth = 200; // Brick pattern width
    const brickPatternHeight = 100; // Brick pattern height
    
    canvas.width = brickPatternWidth;
    canvas.height = brickPatternHeight;
    const ctx = canvas.getContext('2d');

    // Base brick colors (brick blue)
    const brickColor1 = '#132f8b'; 
    const brickColor2 = '#2d35a0'; 
    const brickColor3 = '#3f57cd'; 
    const mortarColor = '#5b5e6b'; 

    // Background (mortar)
    ctx.fillStyle = mortarColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bricks in checkerboard pattern
    const brickRows = 2;
    const brickCols = 4;
    const brickW = (canvas.width - MORTAR_THICKNESS * (brickCols + 1)) / brickCols;
    const brickH = (canvas.height - MORTAR_THICKNESS * (brickRows + 1)) / brickRows;

    for (let row = 0; row < brickRows; row++) {
      const offsetX = row % 2 === 0 ? 0 : brickW / 2; // Offset for checkerboard pattern
      
      for (let col = 0; col < brickCols + 1; col++) {
        const x = offsetX + col * brickW + MORTAR_THICKNESS;
        const y = row * brickH + MORTAR_THICKNESS;
        
        // Alternate colors for more realism
        const colorIndex = (row + col) % 3;
        let brickColor;
        switch (colorIndex) {
          case 0:
            brickColor = brickColor1;
            break;
          case 1:
            brickColor = brickColor2;
            break;
          default:
            brickColor = brickColor3;
        }
        
        ctx.fillStyle = brickColor;
        ctx.fillRect(x, y, brickW - MORTAR_THICKNESS, brickH - MORTAR_THICKNESS);
        
        // Add details (texture lines)
        ctx.strokeStyle = '#212965';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, brickW - MORTAR_THICKNESS, brickH - MORTAR_THICKNESS);
      }
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(width / (brickPatternWidth / 100), WALL_HEIGHT / (brickPatternHeight / 100));
    texture.needsUpdate = true;
    
    return texture;
  }, [width]);

  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[width, WALL_HEIGHT, WALL_THICKNESS]} />
      <meshStandardMaterial
        map={brickTexture}
        color="#1a3656"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

BrickWall.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  rotation: PropTypes.arrayOf(PropTypes.number),
  width: PropTypes.number,
};

BrickWall.defaultProps = {
  rotation: [0, 0, 0],
  width: 20,
};

