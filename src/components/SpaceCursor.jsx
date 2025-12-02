import { useState, useEffect, useRef } from 'react';
import '../styles/SpaceCursor.css';

export default function SpaceCursor() {
  const [isInScene, setIsInScene] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trailParticles, setTrailParticles] = useState([]);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const particleIdRef = useRef(0);
  const lastParticleTimeRef = useRef(0);

  useEffect(() => {
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (!canvasWrapper) return;

    const handleMouseEnter = (e) => {
      setIsInScene(true);
      lastPositionRef.current = { x: e.clientX, y: e.clientY };
      lastParticleTimeRef.current = Date.now();
    };
    
    const handleMouseLeave = () => {
      setIsInScene(false);
      setTrailParticles([]);
    };
    
    const handleMouseMove = (e) => {
      const newPosition = { x: e.clientX, y: e.clientY };
      setPosition(newPosition);

      // Créer des particules de traînée si le curseur bouge
      if (isInScene) {
        const now = Date.now();
        const timeSinceLastParticle = now - lastParticleTimeRef.current;
        const distance = Math.sqrt(
          Math.pow(newPosition.x - lastPositionRef.current.x, 2) +
          Math.pow(newPosition.y - lastPositionRef.current.y, 2)
        );

        // Créer plusieurs particules tous les 4ms ou tous les 1.5 pixels pour une densité plus élevée
        if (timeSinceLastParticle > 4 && distance > 1.5) {
          // Créer 2-3 particules à la fois pour augmenter la densité
          const particleCount = Math.floor(distance / 2) + 1;
          const newParticles = [];
          
          for (let i = 0; i < Math.min(particleCount, 3); i++) {
            // Ajouter un peu de variation aléatoire à la position
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            
            newParticles.push({
              id: particleIdRef.current++,
              x: newPosition.x + offsetX,
              y: newPosition.y + offsetY,
              size: Math.random() * 2 + 1.5,
              createdAt: now + i * 2, // Légère variation temporelle
            });
          }

          setTrailParticles((prev) => {
            const updated = [...prev, ...newParticles];
            // Garder max 100 particules pour une traînée plus dense
            return updated.slice(-80);
          });

          lastParticleTimeRef.current = now;
          lastPositionRef.current = newPosition;
        }
      }
    };

    canvasWrapper.addEventListener('mouseenter', handleMouseEnter);
    canvasWrapper.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvasWrapper.removeEventListener('mouseenter', handleMouseEnter);
      canvasWrapper.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isInScene]);

  // Nettoyer les particules après leur animation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrailParticles((prev) => 
        prev.filter((p) => {
          const elapsed = now - p.createdAt;
          return elapsed < 1200; // Garder les particules pendant 1.2 secondes
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Traînée de poussière d'étoile */}
      {trailParticles.map((particle) => (
        <div
          key={particle.id}
          className="star-dust-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
        />
      ))}

      {/* Curseur principal */}
      {isInScene && (
        <div
          className="space-cursor"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          {/* Nébuleuse planétaire centrale */}
          <div className="planetary-nebula">
            <div className="nebula-core"></div>
            <div className="nebula-layer nebula-layer-1"></div>
            <div className="nebula-layer nebula-layer-2"></div>
            <div className="nebula-layer nebula-layer-3"></div>
            <div className="nebula-glow-inner"></div>
          </div>

          {/* Étoiles orbitantes */}
          <div className="star star-1"></div>
          <div className="star star-2"></div>
          <div className="star star-3"></div>
          <div className="star star-4"></div>
          <div className="star star-5"></div>
          <div className="star star-6"></div>

          {/* Nébuleuse/glow autour */}
          <div className="nebula-glow"></div>
        </div>
      )}
    </>
  );
}

