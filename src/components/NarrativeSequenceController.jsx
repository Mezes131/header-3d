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
  INTRO_DURATION: 9000,        // 9 seconds (3 phrases × 3 seconds)
  INTRO_PHRASE_DURATION: 3000, // 3 seconds per phrase
  REVEAL_DURATION: 3000,       // 3 seconds
  INTERACTION_DURATION: 4000,  // 4 seconds
  AUTO_TRANSITION_DELAY: 2000, // 2 seconds delay before auto-transition to conclusion
};

// Create context for sequence state
const NarrativeSequenceContext = createContext({
  sequenceState: SEQUENCE_STATES.INTRO,
  currentStep: 0,
  elapsedTime: 0,
  introPhraseIndex: 0,
  isPaused: false,
  isReady: false,
  isLoaderComplete: false,
  setLoaderComplete: () => {},
  transitionTo: () => {},
  pause: () => {},
  resume: () => {},
  reset: () => {},
});

// Hook to use narrative sequence context
// Returns default values if context is not available (for backward compatibility)
export const useNarrativeSequence = () => {
  const context = useContext(NarrativeSequenceContext);
  
  // Return default context if not available (allows components to work without controller)
  if (!context || !context.getSequenceElapsedTime) {
    return {
      sequenceState: SEQUENCE_STATES.INTRO,
      currentStep: 0,
      elapsedTime: 0,
      introPhraseIndex: 0,
      isPaused: false,
      isReady: false,
      isLoaderComplete: false,
      setLoaderComplete: () => {},
      transitionTo: () => {},
      pause: () => {},
      resume: () => {},
      reset: () => {},
      updateStep: () => {},
      getSequenceElapsedTime: () => Date.now(), // Return current time as fallback
      SEQUENCE_STATES,
      SEQUENCE_TIMINGS: {
        INTRO_DURATION: 9000,
        INTRO_PHRASE_DURATION: 3000,
        REVEAL_DURATION: 3000,
        INTERACTION_DURATION: 4000,
        AUTO_TRANSITION_DELAY: 2000,
      },
    };
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
  const [introPhraseIndex, setIntroPhraseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoaderComplete, setIsLoaderComplete] = useState(false);
  
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);
  const accumulatedPauseTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const sequenceStartTimeRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const sequenceStateRef = useRef(SEQUENCE_STATES.INTRO); // Track current state in ref
  const introPhraseIndexRef = useRef(0); // Track phrase index in ref

  // Update refs when state changes
  useEffect(() => {
    sequenceStateRef.current = sequenceState;
  }, [sequenceState]);

  useEffect(() => {
    introPhraseIndexRef.current = introPhraseIndex;
  }, [introPhraseIndex]);

  // Transition to a specific sequence state
  const transitionTo = useCallback((newState, step = 0) => {
    if (!Object.values(SEQUENCE_STATES).includes(newState)) {
      console.warn(`[NarrativeSequenceController] Invalid sequence state: ${newState}`);
      return;
    }

    // Prevent duplicate transitions
    if (sequenceStateRef.current === newState) {
      return;
    }

    console.log(`[NarrativeSequenceController] Transitioning from ${sequenceStateRef.current} to ${newState} at step ${step}`);
    const previousState = sequenceStateRef.current;
    sequenceStateRef.current = newState; // Update ref immediately
    setSequenceState(newState);
    setCurrentStep(step);
    sequenceStartTimeRef.current = Date.now();
    
    // Reset intro phrase index when leaving INTRO or entering INTRO
    if (previousState === SEQUENCE_STATES.INTRO && newState !== SEQUENCE_STATES.INTRO) {
      setIntroPhraseIndex(0);
    } else if (newState === SEQUENCE_STATES.INTRO) {
      setIntroPhraseIndex(0);
    }
    
    // Call callback if provided
    if (onSequenceChange) {
      onSequenceChange(newState, step);
    }
  }, [onSequenceChange]);

  // Handle automatic transitions based on elapsed time
  const handleAutoTransitions = useCallback((elapsed) => {
    const currentState = sequenceStateRef.current; // Use ref to get current state
    
    // Handle INTRO phrase transitions
    if (currentState === SEQUENCE_STATES.INTRO) {
      const phraseIndex = Math.floor(elapsed / SEQUENCE_TIMINGS.INTRO_PHRASE_DURATION);
      // Clamp phrase index to valid range (0-2 for 3 phrases)
      const clampedPhraseIndex = Math.min(phraseIndex, 2);
      if (clampedPhraseIndex !== introPhraseIndexRef.current && clampedPhraseIndex >= 0) {
        setIntroPhraseIndex(clampedPhraseIndex);
      }
      
      // Transition to REVEAL after all phrases
      if (elapsed >= SEQUENCE_TIMINGS.INTRO_DURATION) {
        transitionTo(SEQUENCE_STATES.REVEAL);
        return; // Exit early to avoid checking other conditions
      }
    } else if (currentState === SEQUENCE_STATES.REVEAL) {
      // Transition to INTERACTION after REVEAL duration
      if (elapsed >= SEQUENCE_TIMINGS.INTRO_DURATION + SEQUENCE_TIMINGS.REVEAL_DURATION) {
        transitionTo(SEQUENCE_STATES.INTERACTION);
        return;
      }
    } else if (currentState === SEQUENCE_STATES.INTERACTION) {
      // Auto-transition to conclusion only if no interaction happened
      // This will be handled by manual transition when user clicks
      if (elapsed >= SEQUENCE_TIMINGS.INTRO_DURATION + SEQUENCE_TIMINGS.REVEAL_DURATION + SEQUENCE_TIMINGS.INTERACTION_DURATION) {
        // Auto-transition logic can be added here if needed
      }
    }
  }, [transitionTo]);

  // Animation loop to track elapsed time
  const startAnimationLoop = useCallback(() => {
    console.log('[NarrativeSequenceController] Starting animation loop');
    const updateTime = () => {
      if (!isPaused && startTimeRef.current) {
        const now = Date.now();
        const totalElapsed = now - startTimeRef.current - accumulatedPauseTimeRef.current;
        setElapsedTime(totalElapsed);
        
        // Debug log every second
        if (Math.floor(totalElapsed / 1000) !== Math.floor((totalElapsed - 16) / 1000)) {
          console.log(`[NarrativeSequenceController] elapsedTime: ${totalElapsed}ms, sequenceState: ${sequenceStateRef.current}`);
        }
        
        // Auto-transition logic based on elapsed time
        handleAutoTransitions(totalElapsed);
      }
      
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [isPaused, handleAutoTransitions]);

  // Wait for first complete render cycle before marking as ready
  useEffect(() => {
    console.log('[NarrativeSequenceController] Setting up ready check...');
    requestAnimationFrame(() => {
      console.log('[NarrativeSequenceController] First frame complete, marking as ready');
      setIsReady(true);
    });
  }, []);

  // Store startAnimationLoop in a ref to avoid dependency issues
  const startAnimationLoopRef = useRef(startAnimationLoop);
  useEffect(() => {
    startAnimationLoopRef.current = startAnimationLoop;
  }, [startAnimationLoop]);

  // Initialize sequence timing - only start after loader is complete
  useEffect(() => {
    console.log('[NarrativeSequenceController] Initializing - autoStart:', autoStart, 'isPaused:', isPaused, 'isReady:', isReady, 'isLoaderComplete:', isLoaderComplete, 'hasInitialized:', hasInitializedRef.current);
    
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      return;
    }
    
    // Wait for both ready AND loader complete before starting
    if (isReady && isLoaderComplete && autoStart && !isPaused) {
      hasInitializedRef.current = true;
      startTimeRef.current = Date.now();
      sequenceStartTimeRef.current = Date.now();
      accumulatedPauseTimeRef.current = 0;
      console.log('[NarrativeSequenceController] Starting timer at:', startTimeRef.current);
      startAnimationLoopRef.current();
    }
    
    // No cleanup needed - we want the animation loop to continue running
    // The animation frame will only be cancelled on actual unmount or pause
  }, [isReady, isLoaderComplete, autoStart, isPaused]);

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
    setIntroPhraseIndex(0);
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
    introPhraseIndex,
    isPaused,
    isReady,
    isLoaderComplete,
    setLoaderComplete: setIsLoaderComplete,
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

