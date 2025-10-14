import React, { createContext, useContext, useState, useEffect } from 'react';
import { listenToActiveQuiz } from '../utils/firestore';

const QuizContext = createContext();

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export const QuizProvider = ({ children }) => {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🎯 QuizContext: Setting up Firebase listener...');
    
    // Real-time listener for active quiz
    const unsubscribe = listenToActiveQuiz((quiz) => {
      console.log('🎯 QuizContext: Received quiz data:', quiz);
      console.log('🎯 Quiz Status:', quiz?.status);
      console.log('🎯 Has Questions:', quiz?.questions ? 'Yes' : 'No');
      console.log('🎯 Questions Count:', quiz?.questions?.length);
      
      setActiveQuiz(quiz);
      setLoading(false);
    });

    return () => {
      console.log('🎯 QuizContext: Cleaning up listener');
      unsubscribe();
    };
  }, []);

  const value = {
    activeQuiz,
    loading
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};