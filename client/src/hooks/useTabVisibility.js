import { useState, useEffect, useRef } from 'react';
import { updateTabSwitchCount } from '../utils/firestore';

export const useTabVisibility = (quizId, studentName) => {
  const [isVisible, setIsVisible] = useState(true);
  const [switchCount, setSwitchCount] = useState(0);
  const switchCountRef = useRef(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Don't run on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handleVisibilityChange = async () => {
      console.log('👀 Visibility changed - hidden:', document.hidden);
      
      if (document.hidden) {
        // Tab switched away
        setIsVisible(false);
        switchCountRef.current += 1;
        const newCount = switchCountRef.current;
        setSwitchCount(newCount);
        
        // Save to Firebase
        try {
          await updateTabSwitchCount(quizId, studentName, newCount);
          console.log('📊 Tab switch recorded:', newCount, 'for student:', studentName);
        } catch (error) {
          console.error('Error updating tab switch count:', error);
        }
      } else {
        // Tab switched back
        setIsVisible(true);
        console.log('🔙 Tab focused again');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [quizId, studentName]); // Removed switchCount from dependencies

  return { isVisible, switchCount };
};