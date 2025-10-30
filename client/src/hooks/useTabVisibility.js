// import { useState, useEffect, useRef } from 'react';
// import { updateTabSwitchCount } from '../utils/firestore';

// export const useTabVisibility = (quizId, studentName) => {
//   const [isVisible, setIsVisible] = useState(true);
//   const [switchCount, setSwitchCount] = useState(0);
//   const switchCountRef = useRef(0);
//   const isInitialMount = useRef(true);
//   const lastSwitchTimeRef = useRef(0);

//   useEffect(() => {
//     if (isInitialMount.current) {
//       isInitialMount.current = false;
//       return;
//     }
//     console.log('🔧 useTabVisibility hook MOUNTED in production');
// console.log('🔧 Document hidden state:', document.hidden);
// console.log('🔧 Window location:', window.location.hostname);
// const testVisibility = () => console.log('🔧 TEST: visibilitychange fired!');
// document.addEventListener('visibilitychange', testVisibility);
//     const handleTabSwitch = async (source) => {
//       // Debounce: Prevent multiple rapid switches
//       const now = Date.now();
//       if (now - lastSwitchTimeRef.current < 1000) {
//         console.log('⏰ Tab switch debounced');
//         return;
//       }
//       lastSwitchTimeRef.current = now;

//       setIsVisible(false);
//       switchCountRef.current += 1;
//       const newCount = switchCountRef.current;
//       setSwitchCount(newCount);
      
//       console.log(`🔄 Tab switch detected (${source}):`, newCount);
      
//       try {
//         await updateTabSwitchCount(quizId, studentName, newCount);
//         console.log('✅ Tab switch saved to Firestore');
//       } catch (error) {
//         console.error('❌ Tab switch save error:', error);
//       }
//     };

//     const handleVisibilityChange = () => {
//       console.log('👀 Visibility API - hidden:', document.hidden, 'on:', window.location.hostname);
      
//       if (document.hidden) {
//         handleTabSwitch('visibilitychange');
//       } else {
//         setIsVisible(true);
//         console.log('🔙 Tab focused again');
//       }
//     };

//     const handleWindowBlur = () => {
//       console.log('👀 Window blur event');
//       handleTabSwitch('blur');
//     };

//     const handleWindowFocus = () => {
//       console.log('👀 Window focus event');
//       setIsVisible(true);
//     };

//     const handlePageHide = () => {
//       console.log('👀 Page hide event');
//       handleTabSwitch('pagehide');
//     };

//     // Multiple detection methods for maximum compatibility
//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     window.addEventListener('blur', handleWindowBlur);
//     window.addEventListener('focus', handleWindowFocus);
//     window.addEventListener('pagehide', handlePageHide);

//     // Fallback: Check initial state
//     if (document.hidden) {
//       console.log('📱 Page started in background');
//       setIsVisible(false);
//     }

//     return () => {
//       document.removeEventListener('visibilitychange', testVisibility);
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//       window.removeEventListener('blur', handleWindowBlur);
//       window.removeEventListener('focus', handleWindowFocus);
//       window.removeEventListener('pagehide', handlePageHide);
//     };
//   }, [quizId, studentName]);

//   return { isVisible, switchCount };
// };
import { useState, useEffect, useRef } from 'react';
import { updateTabSwitchCount } from '../utils/firestore';

export const useTabVisibility = (quizId, studentName) => {
  const [isVisible, setIsVisible] = useState(true);
  const [switchCount, setSwitchCount] = useState(0);
  const switchCountRef = useRef(0);
  const isInitialMount = useRef(true);
  const lastSwitchTimeRef = useRef(0);

  useEffect(() => {
    console.log('🔧 useTabVisibility hook MOUNTED in production');
    console.log('🔧 Document hidden state:', document.hidden);
    console.log('🔧 Window location:', window.location.hostname);
    
    // Keep initial mount tracking but don't block the effect
    if (isInitialMount.current) {
      console.log('🔧 First mount - setting up event listeners');
      isInitialMount.current = false;
    } else {
      console.log('🔧 Re-render - event listeners already set up');
    }

    const testVisibility = () => console.log('🔧 TEST: visibilitychange fired!');
    document.addEventListener('visibilitychange', testVisibility);

    const handleTabSwitch = async (source) => {
      // Debounce: Prevent multiple rapid switches
      const now = Date.now();
      if (now - lastSwitchTimeRef.current < 1000) {
        console.log('⏰ Tab switch debounced');
        return;
      }
      lastSwitchTimeRef.current = now;

      setIsVisible(false);
      switchCountRef.current += 1;
      const newCount = switchCountRef.current;
      setSwitchCount(newCount);
      
      console.log(`🔄 Tab switch detected (${source}):`, newCount);
      
      try {
        await updateTabSwitchCount(quizId, studentName, newCount);
        console.log('✅ Tab switch saved to Firestore');
      } catch (error) {
        console.error('❌ Tab switch save error:', error);
      }
    };

    const handleVisibilityChange = () => {
      console.log('👀 Visibility API - hidden:', document.hidden, 'on:', window.location.hostname);
      
      if (document.hidden) {
        handleTabSwitch('visibilitychange');
      } else {
        setIsVisible(true);
        console.log('🔙 Tab focused again');
      }
    };

    const handleWindowBlur = () => {
      console.log('👀 Window blur event');
      handleTabSwitch('blur');
    };

    const handleWindowFocus = () => {
      console.log('👀 Window focus event');
      setIsVisible(true);
    };

    const handlePageHide = () => {
      console.log('👀 Page hide event');
      handleTabSwitch('pagehide');
    };

    // Multiple detection methods for maximum compatibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);

    // Fallback: Check initial state
    if (document.hidden) {
      console.log('📱 Page started in background');
      setIsVisible(false);
    }

    return () => {
      console.log('🔧 Cleaning up event listeners');
      document.removeEventListener('visibilitychange', testVisibility);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [quizId, studentName]);

  return { isVisible, switchCount };
};