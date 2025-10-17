import { useState, useEffect } from 'react';
import { updateTabSwitchCount } from '../utils/firestore';

export const useTabVisibility = (quizId, studentName) => {
  const [isVisible, setIsVisible] = useState(true);
  const [switchCount, setSwitchCount] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab switched away
        setIsVisible(false);
        const newCount = switchCount + 1;
        setSwitchCount(newCount);
        
        // Save to Firebase
        try {
          await updateTabSwitchCount(quizId, studentName, newCount);
        } catch (error) {
          console.error('Error updating tab switch count:', error);
        }
      } else {
        // Tab switched back
        setIsVisible(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [quizId, studentName, switchCount]);

  return { isVisible, switchCount };
};