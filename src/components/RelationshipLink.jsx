import { useMemo, useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useNarrativeSequence, SEQUENCE_STATES } from './NarrativeSequenceController';

export default function RelationshipLink({ start, end, appearDelay = 0, sequenceState, selectedPersonId = null }) {
  const narrativeContext = useNarrativeSequence();
  const currentSequenceState = sequenceState || narrativeContext?.sequenceState || SEQUENCE_STATES.INTRO;
  const elapsedTime = narrativeContext?.elapsedTime || 0;
  
  const drawProgressRef = useRef(0);
  const highlightIntensityRef = useRef(0);
  const appearStartTimeRef = useRef(null);
  
  // Initialize appearance timing
  useEffect(() => {
    if (currentSequenceState === SEQUENCE_STATES.REVEAL && !appearStartTimeRef.current) {
      const revealStartTime = 3000; // REVEAL starts at 3s
      appearStartTimeRef.current = revealStartTime + appearDelay;
    }
    // If we're past REVEAL and haven't initialized yet, appear immediately
    else if (
      (currentSequenceState === SEQUENCE_STATES.INTERACTION || 
       currentSequenceState === SEQUENCE_STATES.DISCOVERY || 
       currentSequenceState === SEQUENCE_STATES.CONCLUSION) &&
      !appearStartTimeRef.current
    ) {
      appearStartTimeRef.current = elapsedTime - 100; // Set to slightly in the past so it appears immediately
    }
  }, [currentSequenceState, appearDelay, elapsedTime]);

  // Calculate full path points
  const fullPoints = useMemo(() => {
    const [sx, sy, sz] = start;
    const [ex, ey, ez] = end;
    const nearlyEqual = (a, b, epsilon = 0.001) => Math.abs(a - b) < epsilon;

    // Already aligned horizontally or vertically: straight segment.
    if (nearlyEqual(sx, ex) || nearlyEqual(sy, ey)) {
      return [start, end];
    }

    // Build an orthogonal (L-shaped) path: horizontal segment then vertical.
    const midPoint = [ex, sy, (sz + ez) / 2];
    return [start, midPoint, end];
  }, [start, end]);

  // Track if link has been drawn
  const hasBeenDrawnRef = useRef(false);
  
  // Calculate draw progress for Act 2
  const calculateDrawProgress = () => {
    // If already drawn, stay drawn
    if (hasBeenDrawnRef.current) {
      return 1;
    }
    
    // If not in REVEAL state yet, stay invisible
    if (currentSequenceState !== SEQUENCE_STATES.REVEAL || !appearStartTimeRef.current) {
      return 0;
    }
    
    const appearanceStart = appearStartTimeRef.current;
    const drawDuration = 1000; // 1 second to draw the line
    
    if (elapsedTime < appearanceStart) {
      return 0;
    }
    
    const progress = Math.min((elapsedTime - appearanceStart) / drawDuration, 1);
    
    if (progress >= 1 && !hasBeenDrawnRef.current) {
      hasBeenDrawnRef.current = true;
    }
    
    return progress;
  };

  // Calculate highlight intensity for Act 4 (when card is selected)
  const calculateHighlightIntensity = () => {
    if (currentSequenceState === SEQUENCE_STATES.DISCOVERY && selectedPersonId) {
      // Check if this link is connected to the selected person
      // For now, highlight all links during discovery
      return 0.5;
    }
    return 0;
  };

  // Calculate visible points based on draw progress (recalculated in useFrame)
  const visiblePointsRef = useRef(fullPoints);
  
  // State for color and line width to trigger re-renders
  const [color, setColor] = useState("#6fb2ff");
  const [lineWidth, setLineWidth] = useState(2);
  
  // Animate draw progress and highlight
  useFrame(() => {
    const targetDrawProgress = calculateDrawProgress();
    const targetHighlight = calculateHighlightIntensity();
    
    // Smooth interpolation
    const lerpFactor = 0.1;
    drawProgressRef.current += (targetDrawProgress - drawProgressRef.current) * lerpFactor;
    highlightIntensityRef.current += (targetHighlight - highlightIntensityRef.current) * lerpFactor;
    
    // Update visible points based on draw progress
    if (drawProgressRef.current >= 1) {
      visiblePointsRef.current = fullPoints;
    } else {
      const totalLength = fullPoints.length;
      const visibleCount = Math.ceil(drawProgressRef.current * totalLength);
      
      if (visibleCount <= 1) {
        visiblePointsRef.current = [fullPoints[0]];
      } else {
        visiblePointsRef.current = fullPoints.slice(0, visibleCount);
      }
    }
    
    // Update color and line width
    const baseColor = "#6fb2ff";
    const highlightIntensity = highlightIntensityRef.current;
    
    let newColor = baseColor;
    if (highlightIntensity > 0) {
      // Blend between base and highlight color
      const r = 0x6f + (0xff - 0x6f) * highlightIntensity;
      const g = 0xb2 + (0xff - 0xb2) * highlightIntensity;
      const b = 0xff;
      newColor = `#${Math.floor(r).toString(16).padStart(2, '0')}${Math.floor(g).toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Calculate line width with pulse
    const newLineWidth = 2 + highlightIntensity * 1;
    
    // Update state only if changed (to avoid unnecessary re-renders)
    if (newColor !== color) setColor(newColor);
    if (Math.abs(newLineWidth - lineWidth) > 0.01) setLineWidth(newLineWidth);
  });

  return (
    <Line 
      key={`link-${start[0]}-${start[1]}-${end[0]}-${end[1]}-${Math.floor(drawProgressRef.current * 100)}`}
      points={visiblePointsRef.current} 
      color={color} 
      lineWidth={lineWidth} 
      dashed={false} 
      alphaToCoverage 
    />
  );
}

RelationshipLink.propTypes = {
  start: PropTypes.arrayOf(PropTypes.number).isRequired,
  end: PropTypes.arrayOf(PropTypes.number).isRequired,
  appearDelay: PropTypes.number,
  sequenceState: PropTypes.string,
  selectedPersonId: PropTypes.string,
};

