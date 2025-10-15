import { useState, useEffect, useRef } from 'react';
import { updateCurrentQuestion, endActiveQuiz, startQuizFromWaitingRoom } from '../utils/firestore';

export const useQuizSync = (activeQuiz) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const intervalRef = useRef(null);

  // IMPROVED: Calculate missed questions with better accuracy
  const calculateMissedQuestions = (studentJoinTime) => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions) {
      return 0;
    }

    const quizStartTime = activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    // If student joined before quiz started, no missed questions
    if (studentJoinTime <= quizStartTime) {
      return 0;
    }

    // Calculate how many questions were missed based on join time
    const timeLate = studentJoinTime - quizStartTime;
    const missedCount = Math.floor(timeLate / timePerQuestion);
    
    // Ensure we don't mark more than total questions as missed
    const actualMissed = Math.min(missedCount, activeQuiz.questions.length);
    
    console.log('🎯 Late joiner calculation:', {
      joinTime: new Date(studentJoinTime).toLocaleTimeString(),
      quizStart: new Date(quizStartTime).toLocaleTimeString(),
      timeLate: Math.round(timeLate/1000) + 's',
      missedCount: actualMissed,
      totalQuestions: activeQuiz.questions.length
    });
    
    return actualMissed;
  };

  // IMPROVED: Get current question index with waiting room support
  const getCurrentQuestionIndex = () => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions) {
      return 0;
    }

    // If quiz is in waiting room or hasn't started, show first question
    if (activeQuiz.status === 'waiting' || Date.now() < activeQuiz.quizStartTime) {
      return 0;
    }

    const now = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const elapsedTime = now - quizStartTime;
    const questionIndex = Math.floor(elapsedTime / timePerQuestion);
    
    // Don't go beyond total questions
    return Math.min(questionIndex, activeQuiz.questions.length - 1);
  };

  // IMPROVED: Calculate time remaining with waiting room
  const getTimeRemaining = () => {
    if (!activeQuiz || !activeQuiz.quizStartTime) {
      return 0;
    }

    // If quiz is in waiting room, show countdown to start
    if (activeQuiz.status === 'waiting') {
      const timeUntilStart = activeQuiz.quizStartTime - Date.now();
      return Math.max(0, Math.floor(timeUntilStart / 1000));
    }

    const now = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const currentIndex = getCurrentQuestionIndex();
    const questionStartTime = quizStartTime + (currentIndex * timePerQuestion);
    const timeLeft = (questionStartTime + timePerQuestion) - now;
    
    return Math.max(0, Math.floor(timeLeft / 1000));
  };

  // IMPROVED: Check if quiz ended
  const hasQuizEnded = () => {
    if (!activeQuiz || !activeQuiz.questions || !activeQuiz.quizStartTime) {
      return false;
    }

    const now = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const totalQuizTime = activeQuiz.questions.length * (activeQuiz.timePerQuestion || 30) * 1000;
    
    return (now - quizStartTime) >= totalQuizTime;
  };

  // IMPROVED: Auto-progress questions with waiting room support
  useEffect(() => {
    if (!activeQuiz) {
      setQuizStatus('waiting');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    console.log('🟢 Starting quiz synchronization, status:', activeQuiz.status);

    const updateQuizState = () => {
      const serverIndex = getCurrentQuestionIndex();
      const remaining = getTimeRemaining();
      const ended = hasQuizEnded();

      setCurrentQuestionIndex(serverIndex);
      setTimeRemaining(remaining);

      // Update status based on quiz state
      if (activeQuiz.status === 'waiting') {
        setQuizStatus('waiting');
        
        // Auto-start quiz when countdown reaches 0
        if (Date.now() >= activeQuiz.quizStartTime) {
          console.log('🚀 Auto-starting quiz from waiting room');
          startQuizFromWaitingRoom();
        }
      } else if (ended) {
        setQuizStatus('ended');
      } else {
        setQuizStatus('active');
      }

      // Update server if question changed and quiz is active
      if (serverIndex !== activeQuiz.currentQuestionIndex && activeQuiz.status === 'active' && !ended) {
        updateCurrentQuestion(serverIndex);
      }

      // End quiz if time's up
      if (ended && activeQuiz.status === 'active') {
        console.log('🏁 Quiz ended naturally');
        setQuizStatus('ended');
        endActiveQuiz();
        clearInterval(intervalRef.current);
      }
    };

    // Update every second
    intervalRef.current = setInterval(updateQuizState, 1000);
    updateQuizState(); // Initial update

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeQuiz]);

  return {
    currentQuestionIndex,
    timeRemaining,
    quizStatus,
    calculateMissedQuestions,
    getCurrentQuestionIndex,
    hasQuizEnded
  };
};