"use client";

import { animate } from "framer-motion";
import { useEffect, useState } from "react";

export function useAnimatedText(text: string, delimiter: string = "") {
  const [cursor, setCursor] = useState(0);
  const [startingCursor, setStartingCursor] = useState(0);
  const [prevText, setPrevText] = useState(text);

  if (prevText !== text) {
    setPrevText(text);
    setStartingCursor(text.startsWith(prevText) ? cursor : 0);
  }

  useEffect(() => {
    const parts = text.split(delimiter);
    // Optimized durations for smoother animation
    const duration = delimiter === "" ? 3 : // Character animation - faster
                    delimiter === " " ? 2 : // Word animation - faster  
                    1.5; // Chunk animation - faster
    
    const controls = animate(startingCursor, parts.length, {
      duration,
      ease: "easeInOut", // Smoother easing
      onUpdate(latest) {
        setCursor(Math.floor(latest));
      },
    });

    return () => controls.stop();
  }, [startingCursor, text, delimiter]);

  return text.split(delimiter).slice(0, cursor).join(delimiter);
}