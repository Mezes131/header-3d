import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

// Sequence states enum
export const SEQUENCE_STATES = {
  INTRO: 'intro',           // Acte 1: Introduction (0-3s)
  REVEAL: 'reveal',         // Acte 2: Révélation (3-6s)
  INTERACTION: 'interaction', // Acte 3: Interaction guidée (6-10s)
  DISCOVERY: 'discovery',    // Acte 4: Découverte (après clic)
  CONCLUSION: 'conclusion',  // Acte 5: Conclusion (après exploration)
};

// Timing configuration for each sequence (in milliseconds)
const SEQUENCE_TIMINGS = {
  INTRO_DURATION: 3000,        // 3 seconds
  REVEAL_DURATION: 3000,       // 3 seconds
  INTERACTION_DURATION: 4000,  // 4 seconds
  AUTO_TRANSITION_DELAY: 2000, // 2 seconds delay before auto-transition to conclusion
};

// Create context for sequence state
const NarrativeSequenceContext = createContext({
  sequenceState: SEQUENCE_STATES.INTRO,
  currentStep: 0,
  elapsedTime: 0,
  isPaused: false,
  transitionTo: () => {},
  pause: () => {},
  resume: () => {},
  reset: () => {},
});

// Hook to use narrative sequence context
export const useNarrativeSequence = () => {
  const context = useContext(NarrativeSequenceContext);
  if (!context) {
    throw new Error('useNarrativeSequence must be used within NarrativeSequenceController');
  }
  return context;
};

export default function NarrativeSequenceController({ 
  children, 
  autoStart = true,
  onSequenceChange = null,
  onStepChange = null,
}) {
  const [sequenceState, setSequenceState] = useState(SEQUENCE_STATES.INTRO);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);
  const accumulatedPauseTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const sequenceStartTimeRef = useRef(null);

  // Initialize sequence timing
  useEffect(() => {
    if (autoStart && !isPaused) {
      startTimeRef.current = Date.now();
      sequenceStartTimeRef.current = Date.now();
      accumulatedPauseTimeRef.current = 0;
      startAnimationLoop();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoStart, isPaused]);

  // Animation loop to track elapsed time
  const startAnimationLoop = useCallback(() => {
    const updateTime = () => {
      if (!isPaused && startTimeRef.current) {
        const now = Date.now();
        const totalElapsed = now - startTimeRef.current - accumulatedPauseTimeRef.current;
        setElapsedTime(totalElapsed);
        
        // Auto-transition logic based on elapsed time
        handleAutoTransitions(totalElapsed);
      }
      
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [isPaused]);

  // Handle automatic transitions based on elapsed time
  const handleAutoTransitions = useCallback((elapsed) => {
    if (sequenceState === SEQUENCE_STATES.INTRO && elapsed >= SEQUENCE_TIMINGS.INTRO_DURATION) {
      transitionTo(SEQUENCE_STATES.REVEAL);
    } else if (sequenceState === SEQUENCE_STATES.REVEAL && elapsed >= SEQUENCE_TIMINGS.INTRO_DURATION + SEQUENCE_TIMINGS.REVEAL_DURATION) {
      transitionTo(SEQUENCE_STATES.INTERACTION);
    } else if (sequenceState === SEQUENCE_STATES.INTERACTION && elapsed >= SEQUENCE_TIMINGS.INTRO_DURATION + SEQUENCE_TIMINGS.REVEAL_DURATION + SEQUENCE_TIMINGS.INTERACTION_DURATION) {
      // Auto-transition to conclusion only if no interaction happened
      // This will be handled by manual transition when user clicks
    }
  }, [sequenceState]);

  // Transition to a specific sequence state
  const transitionTo = useCallback((newState, step = 0) => {
    if (!Object.values(SEQUENCE_STATES).includes(newState)) {
      console.warn(`Invalid sequence state: ${newState}`);
      return;
    }

    setSequenceState(newState);
    setCurrentStep(step);
    sequenceStartTimeRef.current = Date.now();
    
    // Call callback if provided
    if (onSequenceChange) {
      onSequenceChange(newState, step);
    }
  }, [onSequenceChange]);

  // Pause the sequence
  const pause = useCallback(() => {
    if (!isPaused) {
      setIsPaused(true);
      pauseTimeRef.current = Date.now();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isPaused]);

  // Resume the sequence
  const resume = useCallback(() => {
    if (isPaused) {
      const pauseDuration = Date.now() - pauseTimeRef.current;
      accumulatedPauseTimeRef.current += pauseDuration;
      setIsPaused(false);
      pauseTimeRef.current = null;
      startAnimationLoop();
    }
  }, [isPaused, startAnimationLoop]);

  // Reset the sequence to initial state
  const reset = useCallback(() => {
    setSequenceState(SEQUENCE_STATES.INTRO);
    setCurrentStep(0);
    setElapsedTime(0);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    sequenceStartTimeRef.current = Date.now();
    accumulatedPauseTimeRef.current = 0;
    pauseTimeRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    startAnimationLoop();
  }, [startAnimationLoop]);

  // Update step
  const updateStep = useCallback((newStep) => {
    setCurrentStep(newStep);
    if (onStepChange) {
      onStepChange(newStep);
    }
  }, [onStepChange]);

  // Calculate time elapsed in current sequence
  const getSequenceElapsedTime = useCallback(() => {
    if (!sequenceStartTimeRef.current) return 0;
    return Date.now() - sequenceStartTimeRef.current - accumulatedPauseTimeRef.current;
  }, []);

  // Context value
  const contextValue = {
    sequenceState,
    currentStep,
    elapsedTime,
    isPaused,
    transitionTo,
    pause,
    resume,
    reset,
    updateStep,
    getSequenceElapsedTime,
    SEQUENCE_STATES,
    SEQUENCE_TIMINGS,
  };

  return (
    <NarrativeSequenceContext.Provider value={contextValue}>
      {children}
    </NarrativeSequenceContext.Provider>
  );
}

NarrativeSequenceController.propTypes = {
  children: PropTypes.node.isRequired,
  autoStart: PropTypes.bool,
  onSequenceChange: PropTypes.func,
  onStepChange: PropTypes.func,
};

