import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNarrativeSequence } from './NarrativeSequenceController';
import '../styles/PageLoader.css';

const MIN_LOADER_DURATION = 3000; // Minimum 2 seconds for loader visibility

export default function PageLoader({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const startTimeRef = useRef(null);
  const hasStartedRef = useRef(false);
  const narrativeContext = useNarrativeSequence();
  const setLoaderComplete = narrativeContext?.setLoaderComplete || (() => {});
  
  const isReady = narrativeContext?.isReady || false;

  useEffect(() => {
    // Record start time
    const startTime = Date.now();
    startTimeRef.current = startTime;
    console.log('[PageLoader] Mounted at:', startTime);
  }, []);

  useEffect(() => {
    // Prevent multiple executions
    if (hasStartedRef.current) {
      return;
    }
    
    console.log('[PageLoader] isReady changed:', isReady);
    
    // Wait for NarrativeSequenceController to be ready
    if (!isReady) {
      console.log('[PageLoader] Waiting for NarrativeSequenceController to be ready...');
      return;
    }

    // Mark as started to prevent re-execution
    hasStartedRef.current = true;
    console.log('[PageLoader] NarrativeSequenceController is ready, waiting for mount...');

    // Wait for multiple frames to ensure Canvas and 3D components are fully mounted
    let frameCount = 0;
    const checkFrames = () => {
      frameCount++;
      
      if (frameCount >= 10) {
        // After frames, calculate elapsed time since start
        const elapsed = Date.now() - (startTimeRef.current || Date.now());
        const remainingTime = Math.max(0, MIN_LOADER_DURATION - elapsed);
        
        console.log(`[PageLoader] All checks complete. Elapsed: ${elapsed}ms, Remaining: ${remainingTime}ms`);

        // Wait for remaining time or minimum delay, then hide loader
        setTimeout(() => {
          console.log('[PageLoader] Setting isLoading to false');
          setIsLoading(false);
          // Start fade-out animation
          setTimeout(() => {
            console.log('[PageLoader] Setting isVisible to false and signaling loader complete');
            setIsVisible(false);
            // Signal that loader is complete - this will start the narrative sequence
            setLoaderComplete(true);
          }, 300); // Fade-out duration
        }, remainingTime);
      } else {
        requestAnimationFrame(checkFrames);
      }
    };

    requestAnimationFrame(checkFrames);
  }, [isReady, setLoaderComplete]);

  return (
    <>
      {/* Always render children so Canvas can mount */}
      {children}
      {/* Show loader overlay until ready */}
      {isVisible && (
        <div className={`page-loader ${!isLoading ? 'fade-out' : ''}`}>
          <div className="page-loader-content">
            <div className="page-loader-text">
              <span className="page-loader-title">Newton Family Tree</span>
              <div className="page-loader-subtitle">
                <span className="page-loader-dot">•</span>
                <span className="page-loader-dot">•</span>
                <span className="page-loader-dot">•</span>
              </div>
            </div>
            <div className="page-loader-glow" />
          </div>
        </div>
      )}
    </>
  );
}

PageLoader.propTypes = {
  children: PropTypes.node.isRequired,
};

