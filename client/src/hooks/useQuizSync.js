import { useState, useEffect, useRef, useCallback } from 'react';
import { endActiveQuiz } from '../utils/firestore';
import { getSyncTime, initializeTimeSync, isTimeSynced } from '../utils/timeSync';

export const useQuizSync = (activeQuiz) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const [timeOffset, setTimeOffset] = useState(0);
  const [timeSyncReady, setTimeSyncReady] = useState(false); // NEW: Sync ready state
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Initialize time synchronization
    const initTimeSync = async () => {
      console.log('🕒 Initializing time synchronization for quiz...');
      const offset = await initializeTimeSync();
      setTimeOffset(offset);
      setTimeSyncReady(true); // MARK SYNC AS READY
      console.log('✅ Time synchronization ready. Offset:', offset, 'ms');
    };
    
    initTimeSync();

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // FIXED: Calculate missed questions with synchronized time
  const calculateMissedQuestions = useCallback((studentJoinTime) => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions) {
      return 0;
    }

    // FIXED: Use synchronized time for calculations
    const syncTime = getSyncTime();
    
    // If student joined before quiz started, no questions missed
    if (studentJoinTime <= activeQuiz.quizStartTime) {
      return 0;
    }

    const timeLate = studentJoinTime - activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    const missedCount = Math.floor(timeLate / timePerQuestion);
    
    // Don't allow more missed questions than total questions
    return Math.min(missedCount, activeQuiz.questions.length);
  }, [activeQuiz]);

  // FIXED: Get current question index using synchronized time
  const getCurrentQuestionIndex = useCallback(() => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions) {
      return 0;
    }

    if (activeQuiz.status === 'paused' || activeQuiz.status === 'waiting') {
      return activeQuiz.currentQuestionIndex || 0;
    }

    if (activeQuiz.status === 'inactive') {
      return 0;
    }

    // FIXED: Use synchronized time instead of client time
    const syncTime = getSyncTime();
    const quizStartTime = activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const elapsedTime = syncTime - quizStartTime;
    const questionIndex = Math.floor(elapsedTime / timePerQuestion);
    
    return Math.min(questionIndex, activeQuiz.questions.length - 1);
  }, [activeQuiz]);

  // FIXED: Get time remaining with synchronized time
  const getTimeRemaining = useCallback(() => {
    if (!activeQuiz || !activeQuiz.quizStartTime) {
      return 0;
    }

    if (activeQuiz.status === 'paused' || activeQuiz.status === 'waiting') {
      return activeQuiz.timePerQuestion || 30;
    }

    if (activeQuiz.status === 'inactive') {
      return 0;
    }

    // FIXED: Use synchronized time
    const syncTime = getSyncTime();
    const quizStartTime = activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const currentIndex = getCurrentQuestionIndex();
    const questionStartTime = quizStartTime + (currentIndex * timePerQuestion);
    const timeLeft = (questionStartTime + timePerQuestion) - syncTime;
    
    return Math.max(0, Math.floor(timeLeft / 1000));
  }, [activeQuiz, getCurrentQuestionIndex]);

  // FIXED: Check if quiz has ended with synchronized time
  const hasQuizEnded = useCallback(() => {
    if (!activeQuiz || !activeQuiz.questions || !activeQuiz.quizStartTime) {
      return false;
    }

    // FIXED: Use synchronized time
    const syncTime = getSyncTime();
    const quizStartTime = activeQuiz.quizStartTime;
    const totalQuizTime = activeQuiz.questions.length * (activeQuiz.timePerQuestion || 30) * 1000;
    
    return (syncTime - quizStartTime) >= totalQuizTime;
  }, [activeQuiz]);

  useEffect(() => {
    // FIXED: Wait for time synchronization to be ready
    if (!activeQuiz || !mountedRef.current || !timeSyncReady) {
      setQuizStatus('waiting');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const updateQuizState = () => {
      if (!mountedRef.current) return;

      const serverIndex = getCurrentQuestionIndex();
      const remaining = getTimeRemaining();
      const ended = hasQuizEnded();

      console.log('🔄 Quiz Sync Update:', {
        currentIndex: serverIndex,
        timeRemaining: remaining,
        quizEnded: ended,
        quizStatus: activeQuiz.status,
        totalQuestions: activeQuiz.questions?.length,
        timeSynced: isTimeSynced(),
        timeOffset: timeOffset,
        timeSyncReady: timeSyncReady // NEW: Log sync status
      });

      setCurrentQuestionIndex(serverIndex);
      setTimeRemaining(remaining);

      // Handle status
      if (activeQuiz.status === 'waiting') {
        setQuizStatus('waiting');
      } else if (activeQuiz.status === 'paused') {
        setQuizStatus('paused');
      } else if (ended || activeQuiz.status === 'inactive') {
        setQuizStatus('ended');
      } else {
        setQuizStatus('active');
      }

      // Auto-end quiz when time is up
      if (ended && activeQuiz.status === 'active') {
        console.log('⏰ Quiz time ended automatically');
        setQuizStatus('ended');
        endActiveQuiz();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    };

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // More frequent updates for better accuracy
    intervalRef.current = setInterval(updateQuizState, 500);
    updateQuizState();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeQuiz, getCurrentQuestionIndex, getTimeRemaining, hasQuizEnded, timeOffset, timeSyncReady]); // ADDED: timeSyncReady

  return {
    currentQuestionIndex,
    timeRemaining,
    quizStatus,
    calculateMissedQuestions
  };
};