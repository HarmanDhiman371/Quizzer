import { 
  saveQuizToFirestore, 
  updateQuizInFirestore, 
  deleteQuizFromFirestore, 
  getQuizzesFromFirestore, 
  getActiveQuizFromFirestore,
  listenToActiveQuiz,
  saveQuizResultToFirestore,
  getQuizResultsFromFirestore,
  listenToQuizResults
} from './firestoreService';

const STORAGE_KEYS = {
  QUIZZES: 'quizzes',
  ACTIVE_QUIZ: 'activeQuiz',
  QUIZ_RESULTS: 'quizResults',
  ATTEMPTED_STUDENTS: 'attemptedStudents',
  QUIZ_CLASSES: 'quizClasses'
};

// Choose storage mode: 'firestore' or 'local'
const STORAGE_MODE = 'firestore'; // Change to 'local' if you want to use localStorage only

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

// Enhanced Quiz storage with Firebase support
export const saveQuiz = async (quiz) => {
  if (STORAGE_MODE === 'firestore') {
    return await saveQuizToFirestore(quiz);
  } else {
    // Fallback to localStorage
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
  }
};

export const getQuizzes = async () => {
  if (STORAGE_MODE === 'firestore') {
    return await getQuizzesFromFirestore();
  } else {
    const quizzes = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    return quizzes ? JSON.parse(quizzes) : [];
  }
};

export const getQuizzesByClass = async (className) => {
  const quizzes = await getQuizzes();
  return quizzes.filter(quiz => quiz.class === className);
};

export const deleteQuiz = async (quizId) => {
  if (STORAGE_MODE === 'firestore') {
    await deleteQuizFromFirestore(quizId);
  } else {
    const quizzes = getQuizzes();
    const filteredQuizzes = quizzes.filter(quiz => quiz.id !== quizId);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(filteredQuizzes));
  }
};

export const setActiveQuiz = async (quiz) => {
  if (STORAGE_MODE === 'firestore') {
    try {
      // Make sure we have a valid quiz ID
      if (!quiz.id) {
        console.error('Cannot set active quiz: No quiz ID provided');
        throw new Error('No quiz ID provided');
      }
      
      console.log('🔄 Setting active quiz:', quiz.id);
      
      // Update the quiz status to active in Firestore
      await updateQuizInFirestore(quiz.id, { 
        status: 'active', 
        startTime: Date.now() 
      });
      
      const activeQuiz = { 
        ...quiz, 
        status: 'active', 
        startTime: Date.now() 
      };
      
      console.log('✅ Active quiz set successfully');
      return activeQuiz;
    } catch (error) {
      console.error('❌ Error setting active quiz:', error);
      throw error;
    }
  } else {
    const activeQuiz = {
      ...quiz,
      startTime: Date.now(),
      status: 'active'
    };
    localStorage.setItem(STORAGE_KEYS.ACTIVE_QUIZ, JSON.stringify(activeQuiz));
    return activeQuiz;
  }
};
export const getActiveQuiz = async () => {
  if (STORAGE_MODE === 'firestore') {
    return await getActiveQuizFromFirestore();
  } else {
    const activeQuiz = localStorage.getItem(STORAGE_KEYS.ACTIVE_QUIZ);
    return activeQuiz ? JSON.parse(activeQuiz) : null;
  }
};

export const clearActiveQuiz = async () => {
  if (STORAGE_MODE === 'firestore') {
    const activeQuiz = await getActiveQuizFromFirestore();
    if (activeQuiz) {
      await updateQuizInFirestore(activeQuiz.id, { status: 'completed' });
    }
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_QUIZ);
  }
};

// Enhanced Results Management
export const saveQuizResult = async (result) => {
  if (STORAGE_MODE === 'firestore') {
    return await saveQuizResultToFirestore(result);
  } else {
    const results = getQuizResults();
    // Remove existing result for same student and quiz
    const filteredResults = results.filter(r => 
      !(r.studentName.toLowerCase() === result.studentName.toLowerCase() && 
        r.quizId === result.quizId)
    );
    filteredResults.push(result);
    localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(filteredResults));
  }
};

export const getQuizResults = async (quizId = null) => {
  try {
    if (STORAGE_MODE === 'firestore') {
      if (quizId) {
        const results = await getQuizResultsFromFirestore(quizId);
        return results || [];
      }
      return []; // Return empty array if no quizId
    } else {
      const results = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
      const allResults = results ? JSON.parse(results) : [];
      return quizId ? allResults.filter(r => r.quizId === quizId) : allResults;
    }
  } catch (error) {
    console.error('Error getting quiz results:', error);
    return []; // Always return array on error
  }
};

export const getResultsByQuiz = async (quizId) => {
  return await getQuizResults(quizId);
};

export const deleteQuizResults = async (quizId) => {
  if (STORAGE_MODE === 'firestore') {
    // Firestore doesn't have a direct way to delete multiple documents by query
    // This would need to be implemented differently
    console.log('Delete quiz results not implemented for Firestore yet');
  } else {
    const results = getQuizResults();
    const filteredResults = results.filter(result => result.quizId !== quizId);
    localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(filteredResults));
  }
};

export const getOverallTopStudents = async (limit = 5) => {
  const results = await getQuizResults();
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

// Real-time listeners - ADD THESE MISSING EXPORTS
export const onActiveQuizChange = (callback) => {
  if (STORAGE_MODE === 'firestore') {
    return listenToActiveQuiz(callback);
  } else {
    // Fallback: poll every 2 seconds for localStorage
    const interval = setInterval(async () => {
      const activeQuiz = await getActiveQuiz();
      callback(activeQuiz);
    }, 2000);
    return () => clearInterval(interval);
  }
};

export const onQuizResultsChange = (quizId, callback) => {
  if (STORAGE_MODE === 'firestore') {
    return listenToQuizResults(quizId, callback);
  } else {
    // Fallback: poll every 2 seconds for localStorage
    const interval = setInterval(async () => {
      const results = await getQuizResults(quizId);
      callback(results);
    }, 2000);
    return () => clearInterval(interval);
  }
};

// Attempt tracking (stays in localStorage for now)
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

// Scheduled quizzes check
export const checkScheduledQuizzes = async () => {
  try {
    const quizzes = await getQuizzes();
    const now = Date.now();
    let startedQuiz = null;

    console.log('🔍 Checking scheduled quizzes...', { 
      now: new Date(now).toLocaleString(),
      totalQuizzes: quizzes.length 
    });

    for (const quiz of quizzes) {
      if (quiz.status === 'scheduled' && quiz.scheduledTime && quiz.scheduledTime <= now) {
        console.log('🚀 Auto-starting quiz:', quiz.name, 'ID:', quiz.id);
        
        try {
          // Auto-start the quiz
          startedQuiz = await setActiveQuiz(quiz);
          console.log('✅ Quiz auto-started successfully:', startedQuiz.name);
          break;
        } catch (error) {
          console.error('❌ Failed to auto-start quiz:', quiz.name, error);
          // Continue to next quiz instead of breaking
          continue;
        }
      }
    }

    return startedQuiz;
  } catch (error) {
    console.error('Error in checkScheduledQuizzes:', error);
    return null;
  }
};

// Temporary function to force start a scheduled quiz
export const forceStartScheduledQuiz = async (quizId) => {
  const quizzes = await getQuizzes();
  const quiz = quizzes.find(q => q.id === quizId);
  
  if (quiz && quiz.status === 'scheduled') {
    return await setActiveQuiz(quiz);
  }
  
  return null;
};

// Debug function
export const debugQuizStatus = async () => {
  const activeQuiz = await getActiveQuiz();
  const allQuizzes = await getQuizzes();
  const scheduledQuizzes = allQuizzes.filter(q => q.status === 'scheduled');
  const activeQuizzes = allQuizzes.filter(q => q.status === 'active');
  
  console.log('=== 🎯 QUIZ DEBUG INFO ===');
  console.log('📍 Active Quiz:', activeQuiz);
  console.log('📊 All Quizzes:', allQuizzes.length);
  console.log('⏰ Scheduled Quizzes:', scheduledQuizzes.length);
  console.log('🎯 Active Quizzes in list:', activeQuizzes.length);
  console.log('🕒 Current Time:', new Date().toLocaleString());
  console.log('💾 Storage Mode:', STORAGE_MODE);
  
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

export const inspectQuizData = (quizId) => {
  console.log('Quiz inspection not fully implemented for quizId:', quizId);
  return null;
};