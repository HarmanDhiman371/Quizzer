const STORAGE_KEYS = {
  QUIZZES: 'quizzes',
  ACTIVE_QUIZ: 'activeQuiz',
  QUIZ_RESULTS: 'quizResults',
  ATTEMPTED_STUDENTS: 'attemptedStudents',
  QUIZ_CLASSES: 'quizClasses'
};

// Quiz Classes Management
export const getQuizClasses = () => {
  const classes = localStorage.getItem(STORAGE_KEYS.QUIZ_CLASSES);
  return classes ? JSON.parse(classes) : [];
};

export const saveQuizClass = (className) => {
  const classes = getQuizClasses();
  if (!classes.includes(className)) {
    classes.push(className);
    localStorage.setItem(STORAGE_KEYS.QUIZ_CLASSES, JSON.stringify(classes));
  }
};

// Enhanced Quiz storage
export const saveQuiz = (quiz) => {
  const quizzes = getQuizzes();
  // Add class to classes list
  saveQuizClass(quiz.class);
  
  // Check if quiz with same ID exists
  const existingIndex = quizzes.findIndex(q => q.id === quiz.id);
  if (existingIndex >= 0) {
    quizzes[existingIndex] = quiz;
  } else {
    quizzes.push(quiz);
  }
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  return quiz;
};

export const getQuizzes = () => {
  const quizzes = localStorage.getItem(STORAGE_KEYS.QUIZZES);
  return quizzes ? JSON.parse(quizzes) : [];
};

export const getQuizzesByClass = (className) => {
  const quizzes = getQuizzes();
  return quizzes.filter(quiz => quiz.class === className);
};

export const deleteQuiz = (quizId) => {
  const quizzes = getQuizzes();
  const filteredQuizzes = quizzes.filter(quiz => quiz.id !== quizId);
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(filteredQuizzes));
};

export const setActiveQuiz = (quiz) => {
  const activeQuiz = {
    ...quiz,
    startTime: Date.now(),
    status: 'active'
  };
  localStorage.setItem(STORAGE_KEYS.ACTIVE_QUIZ, JSON.stringify(activeQuiz));
  return activeQuiz;
};

export const getActiveQuiz = () => {
  const activeQuiz = localStorage.getItem(STORAGE_KEYS.ACTIVE_QUIZ);
  return activeQuiz ? JSON.parse(activeQuiz) : null;
};

export const clearActiveQuiz = () => {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_QUIZ);
};

// Enhanced Results Management
export const saveQuizResult = (result) => {
  const results = getQuizResults();
  // Remove existing result for same student and quiz
  const filteredResults = results.filter(r => 
    !(r.studentName.toLowerCase() === result.studentName.toLowerCase() && 
      r.quizId === result.quizId)
  );
  filteredResults.push(result);
  localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(filteredResults));
};

export const getQuizResults = () => {
  const results = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
  return results ? JSON.parse(results) : [];
};

export const getResultsByQuiz = (quizId) => {
  const results = getQuizResults();
  return results.filter(result => result.quizId === quizId);
};

export const deleteQuizResults = (quizId) => {
  const results = getQuizResults();
  const filteredResults = results.filter(result => result.quizId !== quizId);
  localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(filteredResults));
};

export const getOverallTopStudents = (limit = 5) => {
  const results = getQuizResults();
  const studentPerformance = {};
  
  results.forEach(result => {
    if (!studentPerformance[result.studentName]) {
      studentPerformance[result.studentName] = {
        totalQuizzes: 0,
        totalScore: 0,
        totalPossible: 0,
        averagePercentage: 0
      };
    }
    
    studentPerformance[result.studentName].totalQuizzes++;
    studentPerformance[result.studentName].totalScore += result.score;
    studentPerformance[result.studentName].totalPossible += result.totalQuestions;
  });
  
  // Calculate averages
  Object.keys(studentPerformance).forEach(student => {
    const perf = studentPerformance[student];
    perf.averagePercentage = Math.round((perf.totalScore / perf.totalPossible) * 100);
  });
  
  return Object.entries(studentPerformance)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.averagePercentage - a.averagePercentage)
    .slice(0, limit);
};

// Attempt tracking
export const hasStudentAttempted = (quizId, studentName) => {
  const attempted = localStorage.getItem(STORAGE_KEYS.ATTEMPTED_STUDENTS);
  const attemptedMap = attempted ? JSON.parse(attempted) : {};
  return !!attemptedMap[`${quizId}_${studentName.toLowerCase()}`];
};

export const markStudentAttempted = (quizId, studentName) => {
  const attempted = localStorage.getItem(STORAGE_KEYS.ATTEMPTED_STUDENTS);
  const attemptedMap = attempted ? JSON.parse(attempted) : {};
  attemptedMap[`${quizId}_${studentName.toLowerCase()}`] = true;
  localStorage.setItem(STORAGE_KEYS.ATTEMPTED_STUDENTS, JSON.stringify(attemptedMap));
};
// Add this to your storage.js file
export const checkScheduledQuizzes = () => {
  const quizzes = getQuizzes();
  const now = Date.now();
  let startedQuiz = null;

  console.log('🔍 Checking scheduled quizzes...', { 
    now: new Date(now).toLocaleString(),
    totalQuizzes: quizzes.length 
  });

  const updatedQuizzes = quizzes.map(quiz => {
    // Check if this is a scheduled quiz that should start now
    if (quiz.status === 'scheduled' && quiz.scheduledTime && quiz.scheduledTime <= now) {
      console.log('🚀 Auto-starting quiz:', quiz.name, 
        'scheduled:', new Date(quiz.scheduledTime).toLocaleString(),
        'now:', new Date(now).toLocaleString()
      );
      
      // Create active quiz
      startedQuiz = {
        ...quiz,
        startTime: now,
        status: 'active'
      };
      
      console.log('✅ New active quiz:', startedQuiz);
      return startedQuiz; // Return the updated quiz
    }
    return quiz; // Return unchanged quiz
  });

  // Save all updated quizzes back to storage
  if (startedQuiz) {
    console.log('💾 Saving updated quizzes to storage...');
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updatedQuizzes));
    
    // Also set as active quiz
    setActiveQuiz(startedQuiz);
    console.log('🎯 Active quiz set:', startedQuiz.name);
  }

  return startedQuiz;
};
// Add this debug function to storage.js
export const debugQuizStatus = () => {
  const activeQuiz = getActiveQuiz();
  const allQuizzes = getQuizzes();
  const scheduledQuizzes = allQuizzes.filter(q => q.status === 'scheduled');
  const activeQuizzes = allQuizzes.filter(q => q.status === 'active');
  
  console.log('=== 🎯 QUIZ DEBUG INFO ===');
  console.log('📍 Active Quiz in localStorage:', activeQuiz);
  console.log('📊 All Quizzes:', allQuizzes.length);
  console.log('⏰ Scheduled Quizzes:', scheduledQuizzes.length);
  console.log('🎯 Active Quizzes in list:', activeQuizzes.length);
  console.log('🕒 Current Time:', new Date().toLocaleString());
  
  if (activeQuiz) {
    console.log('✅ Active Quiz Details:', {
      name: activeQuiz.name,
      startTime: new Date(activeQuiz.startTime).toLocaleString(),
      status: activeQuiz.status,
      questions: activeQuiz.questions?.length
    });
  }
  
  scheduledQuizzes.forEach(quiz => {
    const timeUntilStart = (quiz.scheduledTime - Date.now()) / 1000;
    console.log(`📅 Scheduled Quiz "${quiz.name}":`, {
      scheduled: new Date(quiz.scheduledTime).toLocaleString(),
      timeUntilStart: timeUntilStart + ' seconds',
      shouldStart: timeUntilStart <= 0 ? 'YES - SHOULD START!' : 'no'
    });
  });

  activeQuizzes.forEach(quiz => {
    console.log(`🎯 Active Quiz "${quiz.name}":`, {
      startTime: new Date(quiz.startTime).toLocaleString(),
      runningFor: ((Date.now() - quiz.startTime) / 1000) + ' seconds'
    });
  });
  console.log('========================');
};
// Temporary function to force start a scheduled quiz
export const forceStartScheduledQuiz = (quizId) => {
  const quizzes = getQuizzes();
  const quiz = quizzes.find(q => q.id === quizId);
  
  if (quiz && quiz.status === 'scheduled') {
    const activeQuiz = {
      ...quiz,
      startTime: Date.now(),
      status: 'active'
    };
    
    // Update the quiz in the list
    const updatedQuizzes = quizzes.map(q => 
      q.id === quizId ? activeQuiz : q
    );
    
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updatedQuizzes));
    setActiveQuiz(activeQuiz);
    
    console.log('🚀 FORCE STARTED QUIZ:', activeQuiz.name);
    return activeQuiz;
  }
  
  return null;
};
// Add this to storage.js
export const inspectQuizData = (quizId) => {
  const quiz = getQuizzes().find(q => q.id === quizId);
  console.log('🔍 Quiz Inspection:', quiz);
  return quiz;
};