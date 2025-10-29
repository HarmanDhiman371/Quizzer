import { useState, useEffect, useRef, useCallback } from 'react';
import { endActiveQuiz } from '../utils/firestore';
import { getSyncTime, initializeTimeSync, isTimeSynced } from '../utils/timeSync';

export const useQuizSync = (activeQuiz) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const [timeOffset, setTimeOffset] = useState(0);
  const [timeSyncReady, setTimeSyncReady] = useState(false);
  const [studentJoinTime, setStudentJoinTime] = useState(null); // NEW: Track when student actually joined
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Initialize time synchronization
    const initTimeSync = async () => {
      console.log('🕒 Initializing time synchronization for quiz...');
      const offset = await initializeTimeSync();
      setTimeOffset(offset);
      setTimeSyncReady(true);
      
      // NEW: Set student join time AFTER sync is ready
      setStudentJoinTime(getSyncTime());
      
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

  // FIXED: Calculate missed questions - only count questions missed AFTER student joined
  const calculateMissedQuestions = useCallback((joinTime) => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions || !joinTime) {
      return 0;
    }

    // Only count time after student joined
    const timeAfterJoin = Math.max(0, getSyncTime() - joinTime);
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    const missedCount = Math.floor(timeAfterJoin / timePerQuestion);
    
    return Math.min(missedCount, activeQuiz.questions.length - 1); // Can't miss more than total-1
  }, [activeQuiz]);

  // FIXED: Get current question index - based on time since student joined, not quiz start
  const getCurrentQuestionIndex = useCallback(() => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions || !studentJoinTime) {
      return 0;
    }

    if (activeQuiz.status === 'paused' || activeQuiz.status === 'waiting') {
      return activeQuiz.currentQuestionIndex || 0;
    }

    if (activeQuiz.status === 'inactive') {
      return 0;
    }

    // FIXED: Calculate based on time since STUDENT JOINED, not quiz start
    const timeSinceJoin = getSyncTime() - studentJoinTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const questionIndex = Math.floor(timeSinceJoin / timePerQuestion);
    
    return Math.min(questionIndex, activeQuiz.questions.length - 1);
  }, [activeQuiz, studentJoinTime]);

  // FIXED: Get time remaining - based on student's personal timer
  const getTimeRemaining = useCallback(() => {
    if (!activeQuiz || !studentJoinTime) {
      return 0;
    }

    if (activeQuiz.status === 'paused' || activeQuiz.status === 'waiting') {
      return activeQuiz.timePerQuestion || 30;
    }

    if (activeQuiz.status === 'inactive') {
      return 0;
    }

    const timeSinceJoin = getSyncTime() - studentJoinTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const currentIndex = getCurrentQuestionIndex();
    const questionStartTime = studentJoinTime + (currentIndex * timePerQuestion);
    const timeLeft = (questionStartTime + timePerQuestion) - getSyncTime();
    
    return Math.max(0, Math.floor(timeLeft / 1000));
  }, [activeQuiz, getCurrentQuestionIndex, studentJoinTime]);

  // FIXED: Check if quiz has ended for this student
  const hasQuizEnded = useCallback(() => {
    if (!activeQuiz || !activeQuiz.questions || !studentJoinTime) {
      return false;
    }

    const timeSinceJoin = getSyncTime() - studentJoinTime;
    const totalQuizTime = activeQuiz.questions.length * (activeQuiz.timePerQuestion || 30) * 1000;
    
    return timeSinceJoin >= totalQuizTime;
  }, [activeQuiz, studentJoinTime]);

  useEffect(() => {
    // Wait for time synchronization AND student join time to be set
    if (!activeQuiz || !mountedRef.current || !timeSyncReady || !studentJoinTime) {
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
        studentJoinTime: new Date(studentJoinTime).toISOString(),
        quizStartTime: activeQuiz.quizStartTime ? new Date(activeQuiz.quizStartTime).toISOString() : 'N/A',
        timeSinceJoin: getSyncTime() - studentJoinTime
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
        console.log('⏰ Quiz time ended automatically for student');
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

    intervalRef.current = setInterval(updateQuizState, 500);
    updateQuizState();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeQuiz, getCurrentQuestionIndex, getTimeRemaining, hasQuizEnded, timeSyncReady, studentJoinTime]);

  return {
    currentQuestionIndex,
    timeRemaining,
    quizStatus,
    calculateMissedQuestions
  };
};