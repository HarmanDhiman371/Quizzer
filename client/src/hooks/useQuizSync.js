import { useState, useEffect, useRef } from 'react';
import { updateCurrentQuestion, endActiveQuiz } from '../utils/firestore';

export const useQuizSync = (activeQuiz) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const intervalRef = useRef(null);

  // FIXED: Calculate missed questions properly
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
    
    // Don't mark more than total questions as missed
    return Math.min(missedCount, activeQuiz.questions.length);
  };

  // FIXED: Get current question index
  const getCurrentQuestionIndex = () => {
    if (!activeQuiz || !activeQuiz.quizStartTime || !activeQuiz.questions) {
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

  // FIXED: Calculate time remaining
  const getTimeRemaining = () => {
    if (!activeQuiz || !activeQuiz.quizStartTime) {
      return 0;
    }

    const now = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const timePerQuestion = (activeQuiz.timePerQuestion || 30) * 1000;
    
    const currentIndex = getCurrentQuestionIndex();
    const questionStartTime = quizStartTime + (currentIndex * timePerQuestion);
    const timeLeft = (questionStartTime + timePerQuestion) - now;
    
    return Math.max(0, Math.floor(timeLeft / 1000));
  };

  // FIXED: Check if quiz ended
  const hasQuizEnded = () => {
    if (!activeQuiz || !activeQuiz.questions || !activeQuiz.quizStartTime) {
      return false;
    }

    const now = Date.now();
    const quizStartTime = activeQuiz.quizStartTime;
    const totalQuizTime = activeQuiz.questions.length * (activeQuiz.timePerQuestion || 30) * 1000;
    
    return (now - quizStartTime) >= totalQuizTime;
  };

  // FIXED: Auto-progress questions
  useEffect(() => {
    if (!activeQuiz || activeQuiz.status !== 'active') {
      setQuizStatus('waiting');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    console.log('🟢 Starting quiz synchronization');

    const updateQuizState = () => {
      const serverIndex = getCurrentQuestionIndex();
      const remaining = getTimeRemaining();
      const ended = hasQuizEnded();

      setCurrentQuestionIndex(serverIndex);
      setTimeRemaining(remaining);

      // Update server if question changed
      if (serverIndex !== activeQuiz.currentQuestionIndex && !ended) {
        updateCurrentQuestion(serverIndex);
      }

      // End quiz if time's up
      if (ended) {
        console.log('🏁 Quiz ended naturally');
        setQuizStatus('ended');
        endActiveQuiz();
        clearInterval(intervalRef.current);
      } else {
        setQuizStatus('active');
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