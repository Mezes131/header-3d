import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { CanvasTexture, RepeatWrapping } from 'three';

const WALL_HEIGHT = 1;
const WALL_THICKNESS = 0.3;
const MORTAR_THICKNESS = 0.02;

export default function BrickWall({ position, rotation, width }) {
  // Création d'une texture de brique procédurale
  const brickTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const brickPatternWidth = 200; // Largeur du motif de brique
    const brickPatternHeight = 100; // Hauteur du motif de brique
    
    canvas.width = brickPatternWidth;
    canvas.height = brickPatternHeight;
    const ctx = canvas.getContext('2d');

    // Couleur de base des briques (bleu brique)
    const brickColor1 = '#132f8b'; 
    const brickColor2 = '#2d35a0'; 
    const brickColor3 = '#3f57cd'; 
    const mortarColor = '#5b5e6b'; 

    // Fond (mortier)
    ctx.fillStyle = mortarColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner les briques en damier
    const brickRows = 2;
    const brickCols = 4;
    const brickW = (canvas.width - MORTAR_THICKNESS * (brickCols + 1)) / brickCols;
    const brickH = (canvas.height - MORTAR_THICKNESS * (brickRows + 1)) / brickRows;

    for (let row = 0; row < brickRows; row++) {
      const offsetX = row % 2 === 0 ? 0 : brickW / 2; // Décalage pour motif en damier
      
      for (let col = 0; col < brickCols + 1; col++) {
        const x = offsetX + col * brickW + MORTAR_THICKNESS;
        const y = row * brickH + MORTAR_THICKNESS;
        
        // Alterner les couleurs pour plus de réalisme
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
        
        // Ajouter des détails (lignes de texture)
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

