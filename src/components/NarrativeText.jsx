import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNarrativeSequence } from './NarrativeSequenceController';
import '../styles/NarrativeText.css';

const FADE_DURATION = 500; // Duration of fade transition in milliseconds
const INACTIVITY_TIMEOUT = 5000; // 5 seconds of inactivity before showing text again

export default function NarrativeText({ text }) {
  const [displayText, setDisplayText] = useState(text);
  const [opacity, setOpacity] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Visibility based on user activity
  const previousTextRef = useRef(text);
  const transitionStartTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mountedRef = useRef(false);
  const inactivityTimeoutRef = useRef(null);
  const lastInteractionTimeRef = useRef(Date.now());

  const narrativeContext = useNarrativeSequence();
  const getSequenceElapsedTime = narrativeContext?.getSequenceElapsedTime || (() => Date.now());

  // Handle user interactions (mouse move, click, wheel)
  useEffect(() => {
    const handleInteraction = () => {
      lastInteractionTimeRef.current = Date.now();
      
      // Hide text immediately on interaction
      setIsVisible(false);
      
      // Clear existing timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      
      // Set timeout to show text again after inactivity
      inactivityTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, INACTIVITY_TIMEOUT);
    };

    // Add event listeners
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('wheel', handleInteraction);

    // Initial timeout to show text after mount (if no interaction)
    inactivityTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, INACTIVITY_TIMEOUT);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('wheel', handleInteraction);
      
      // Clear timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only set up once on mount

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
      let baseOpacity = 0;
      
      if (isTransitioning && transitionStartTimeRef.current) {
        const elapsed = now - transitionStartTimeRef.current;
        
        if (elapsed < FADE_DURATION) {
          // Fade-out phase
          const fadeProgress = elapsed / FADE_DURATION;
          baseOpacity = 1 - fadeProgress;
        } else if (elapsed < FADE_DURATION * 2) {
          // Text change happens here (mid-transition)
          if (elapsed < FADE_DURATION * 1.1 && displayText !== text) {
            setDisplayText(text);
            previousTextRef.current = text;
          }
          
          // Fade-in phase
          const fadeProgress = (elapsed - FADE_DURATION) / FADE_DURATION;
          baseOpacity = fadeProgress;
        } else {
          // Transition complete
          baseOpacity = 1;
          setIsTransitioning(false);
        }
      } else if (transitionStartTimeRef.current) {
        // Initial fade-in for first text
        const elapsed = now - transitionStartTimeRef.current;
        const fadeProgress = Math.min(elapsed / FADE_DURATION, 1);
        baseOpacity = fadeProgress;
        
        if (fadeProgress >= 1) {
          // Fade-in complete, continue animation for visibility control
        }
      }
      
      // Apply visibility based on user activity
      const finalOpacity = isVisible ? baseOpacity : 0;
      setOpacity(finalOpacity);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTransitioning, text, displayText, isVisible]);

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

