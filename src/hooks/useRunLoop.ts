import { useEffect } from 'react';

import { useGAStore } from '../store/useGAStore';

export const useRunLoop = () => {
  const running = useGAStore((state) => state.gaState.running);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    let frame = 0;
    const tick = () => {
      const { gaState, config, step, pause } = useGAStore.getState();
      if (!gaState.running) {
        return;
      }
      if (gaState.generation >= config.maxGenerations) {
        pause();
        return;
      }
      step();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
};
