import { useState, useEffect } from 'react';

export const useTabVisibility = (onTabSwitch) => {
  const [isVisible, setIsVisible] = useState(true);
  const [switchCount, setSwitchCount] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switched away
        setIsVisible(false);
        setSwitchCount(prev => {
          const newCount = prev + 1;
          onTabSwitch && onTabSwitch(newCount);
          return newCount;
        });
      } else {
        // Tab switched back
        setIsVisible(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onTabSwitch]);

  return { isVisible, switchCount };
};