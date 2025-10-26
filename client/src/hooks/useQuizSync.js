import { useState, useEffect, useRef, useCallback } from 'react';
import { updateCurrentQuestion, endActiveQuiz } from '../utils/firestore';

export const useQuizSync = (activeQuiz) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // FIXED: Calculate missed questions
  const calculateMissedQuestions = useCallback((studentJoinTime) => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions) {
      return 0;
    }

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

  // FIXED: Get current question index using server time
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

    // FIXED: Use current time instead of server time for real-time updates
    const currentTime = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const elapsedTime = currentTime - quizStartTime;
    const questionIndex = Math.floor(elapsedTime / timePerQuestion);
    
    return Math.min(questionIndex, activeQuiz.questions.length - 1);
  }, [activeQuiz]);

  // FIXED: Get time remaining with current time
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

    // FIXED: Use current time for real-time countdown
    const currentTime = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const currentIndex = getCurrentQuestionIndex();
    const questionStartTime = quizStartTime + (currentIndex * timePerQuestion);
    const timeLeft = (questionStartTime + timePerQuestion) - currentTime;
    
    return Math.max(0, Math.floor(timeLeft / 1000));
  }, [activeQuiz, getCurrentQuestionIndex]);

  // FIXED: Check if quiz has ended
  const hasQuizEnded = useCallback(() => {
    if (!activeQuiz || !activeQuiz.questions || !activeQuiz.quizStartTime) {
      return false;
    }

    const currentTime = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const totalQuizTime = activeQuiz.questions.length * (activeQuiz.timePerQuestion || 30) * 1000;
    
    return (currentTime - quizStartTime) >= totalQuizTime;
  }, [activeQuiz]);

  useEffect(() => {
    if (!activeQuiz || !mountedRef.current) {
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
        totalQuestions: activeQuiz.questions?.length
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

    // FIXED: More frequent updates for better accuracy
    intervalRef.current = setInterval(updateQuizState, 500);
    updateQuizState();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeQuiz, getCurrentQuestionIndex, getTimeRemaining, hasQuizEnded]);

  return {
    currentQuestionIndex,
    timeRemaining,
    quizStatus,
    calculateMissedQuestions
  };
};