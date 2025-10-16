import { useState, useEffect, useRef } from 'react';
import { updateCurrentQuestion, endActiveQuiz, startQuizFromWaitingRoom } from '../utils/firestore';

export const useQuizSync = (activeQuiz) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const intervalRef = useRef(null);

  const calculateMissedQuestions = (studentJoinTime) => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions) {
      return 0;
    }

    if (studentJoinTime <= activeQuiz.quizStartTime) {
      return 0;
    }

    const timeLate = studentJoinTime - activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    const missedCount = Math.floor(timeLate / timePerQuestion);
    
    return Math.min(missedCount, activeQuiz.questions.length);
  };

  const getCurrentQuestionIndex = () => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions) {
      return 0;
    }

    // Handle paused state
    if (activeQuiz.status === 'paused') {
      return activeQuiz.currentQuestionIndex || 0;
    }

    if (activeQuiz.status === 'waiting' || Date.now() < activeQuiz.quizStartTime) {
      return 0;
    }

    const now = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const elapsedTime = now - quizStartTime;
    const questionIndex = Math.floor(elapsedTime / timePerQuestion);
    
    return Math.min(questionIndex, activeQuiz.questions.length - 1);
  };

  const getTimeRemaining = () => {
    if (!activeQuiz || !activeQuiz.quizStartTime) {
      return 0;
    }

    if (activeQuiz.status === 'paused') {
      return activeQuiz.timePerQuestion || 30;
    }

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

  const hasQuizEnded = () => {
    if (!activeQuiz || !activeQuiz.questions || !activeQuiz.quizStartTime) {
      return false;
    }

    const now = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const totalQuizTime = activeQuiz.questions.length * (activeQuiz.timePerQuestion || 30) * 1000;
    
    return (now - quizStartTime) >= totalQuizTime;
  };

  useEffect(() => {
    if (!activeQuiz) {
      setQuizStatus('waiting');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const updateQuizState = () => {
      const serverIndex = getCurrentQuestionIndex();
      const remaining = getTimeRemaining();
      const ended = hasQuizEnded();

      setCurrentQuestionIndex(serverIndex);
      setTimeRemaining(remaining);

      // Handle different statuses
      if (activeQuiz.status === 'waiting') {
        setQuizStatus('waiting');
        if (Date.now() >= activeQuiz.quizStartTime) {
          startQuizFromWaitingRoom();
        }
      } else if (activeQuiz.status === 'paused') {
        setQuizStatus('paused');
      } else if (ended || activeQuiz.status === 'inactive') {
        setQuizStatus('ended');
      } else {
        setQuizStatus('active');
      }

      // Update server if needed
      if (serverIndex !== activeQuiz.currentQuestionIndex && 
          activeQuiz.status === 'active' && 
          !ended) {
        updateCurrentQuestion(serverIndex);
      }

      // Auto-end quiz
      if (ended && activeQuiz.status === 'active') {
        setQuizStatus('ended');
        endActiveQuiz();
        clearInterval(intervalRef.current);
      }
    };

    intervalRef.current = setInterval(updateQuizState, 1000);
    updateQuizState();

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
    calculateMissedQuestions
  };
};