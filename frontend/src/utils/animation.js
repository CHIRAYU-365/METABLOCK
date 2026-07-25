


export const fadeIn = (targets, options = {}) => {
  const { duration = 600, delay = 0, translateY = 0, easing = 'easeOutQuad' } = options;
  return window.anime({
    targets,
    opacity: [0, 1],
    translateY,
    duration,
    delay,
    easing,
  });
};

export const slideUp = (targets, options = {}) => {
  const { duration = 600, delay = 0, distance = 20, easing = 'easeOutQuad' } = options;
  return window.anime({
    targets,
    opacity: [0, 1],
    translateY: [distance, 0],
    duration,
    delay,
    easing,
  });
};

export const scaleIn = (targets, options = {}) => {
  const { duration = 400, delay = 0, scale = 1.05, easing = 'easeOutQuad' } = options;
  return window.anime({
    targets,
    opacity: [0, 1],
    scale: [scale, 1],
    duration,
    delay,
    easing,
  });
};


import { useEffect } from 'react';
export const useAnime = (ref, animationFn, ...args) => {
  useEffect(() => {
    if (ref?.current) {
      animationFn(ref.current, ...args);
    }
  }, [ref, animationFn, ...args]);
};
