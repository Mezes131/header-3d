import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNarrativeSequence } from './NarrativeSequenceController';
import '../styles/NarrativeText.css';

const FADE_DURATION = 500; // Duration of fade transition in milliseconds

export default function NarrativeText({ text }) {
  const [displayText, setDisplayText] = useState(text);
  const [opacity, setOpacity] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousTextRef = useRef(text);
  const transitionStartTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mountedRef = useRef(false);

  const narrativeContext = useNarrativeSequence();
  const getSequenceElapsedTime = narrativeContext?.getSequenceElapsedTime || (() => Date.now());

  // Initial fade-in on mount
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      transitionStartTimeRef.current = Date.now();
      // Start with opacity 0, will fade in
      setOpacity(0);
    }
  }, []);

  // Handle text changes with fade transition
  useEffect(() => {
    if (text !== previousTextRef.current && mountedRef.current) {
      // Start fade-out transition
      setIsTransitioning(true);
      transitionStartTimeRef.current = Date.now();
      setOpacity(1);
    }
  }, [text]);

  // Animation loop for fade transitions
  useEffect(() => {
    if (!mountedRef.current) return;

    const animate = () => {
      const now = Date.now();
      
      if (isTransitioning && transitionStartTimeRef.current) {
        const elapsed = now - transitionStartTimeRef.current;
        
        if (elapsed < FADE_DURATION) {
          // Fade-out phase
          const fadeProgress = elapsed / FADE_DURATION;
          setOpacity(1 - fadeProgress);
        } else if (elapsed < FADE_DURATION * 2) {
          // Text change happens here (mid-transition)
          if (elapsed < FADE_DURATION * 1.1 && displayText !== text) {
            setDisplayText(text);
            previousTextRef.current = text;
          }
          
          // Fade-in phase
          const fadeProgress = (elapsed - FADE_DURATION) / FADE_DURATION;
          setOpacity(fadeProgress);
        } else {
          // Transition complete
          setOpacity(1);
          setIsTransitioning(false);
        }
      } else if (transitionStartTimeRef.current) {
        // Initial fade-in for first text
        const elapsed = now - transitionStartTimeRef.current;
        const fadeProgress = Math.min(elapsed / FADE_DURATION, 1);
        setOpacity(fadeProgress);
        
        if (fadeProgress >= 1) {
          // Fade-in complete, stop animation
          return;
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTransitioning, text, displayText]);

  return (
    <div 
      className="narrative-text"
      style={{ 
        opacity: opacity,
        transition: isTransitioning ? 'none' : 'opacity 0.3s ease-in-out'
      }}
    >
      {displayText}
    </div>
  );
}

NarrativeText.propTypes = {
  text: PropTypes.string.isRequired,
};

