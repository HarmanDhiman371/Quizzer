import { 
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, setDoc, limit
} from 'firebase/firestore';
import { db } from '../firebase/config';

const QUIZZES_COLLECTION = 'quizzes';
const ACTIVE_QUIZ_COLLECTION = 'activeQuiz';
const RESULTS_COLLECTION = 'results';
const CLASS_RESULTS_COLLECTION = 'classResults';

// Initialize active quiz document
export const initializeActiveQuiz = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const docSnap = await getDoc(activeQuizRef);
    
    if (!docSnap.exists()) {
      await setDoc(activeQuizRef, {
        status: 'inactive',
        lastUpdated: serverTimestamp()
      });
      console.log('✅ Active quiz document initialized');
    }
  } catch (error) {
    console.error('Error initializing active quiz:', error);
  }
};

// Quiz Operations
export const saveQuizToFirestore = async (quiz) => {
  try {
    const quizWithTimestamp = {
      ...quiz,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'scheduled',
      currentQuestionIndex: 0
    };
    
    const { id, ...quizData } = quizWithTimestamp;
    const docRef = await addDoc(collection(db, QUIZZES_COLLECTION), quizData);
    return { id: docRef.id, ...quizData };
  } catch (error) {
    console.error('Error saving quiz:', error);
    throw error;
  }
};
export const getScheduledQuizById = async (quizId) => {
  try {
    const quizDoc = await getDoc(doc(db, QUIZZES_COLLECTION, quizId));
    if (quizDoc.exists()) {
      return { id: quizDoc.id, ...quizDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting scheduled quiz:', error);
    return null;
  }
};
export const activateScheduledQuiz = async (quizId) => {
  try {
    const quiz = await getScheduledQuizById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
    const activeQuizData = {
      ...quiz,
      originalQuizId: quiz.id,
      quizStartTime: null, // ← CHANGE THIS: Remove auto-start timer
      currentQuestionIndex: 0,
      totalParticipants: 0,
      waitingParticipants: [],
      status: 'waiting',
      lastUpdated: serverTimestamp(),
      isFromScheduled: true
    };

    console.log('🚀 Moving scheduled quiz to waiting room:', quiz.name);
    
    await setDoc(activeQuizRef, activeQuizData);
    
    // Update the scheduled quiz status
    await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
      status: 'activated',
      activatedAt: serverTimestamp()
    });
    
    console.log('✅ Scheduled quiz moved to waiting room (waiting for admin to start):', quiz.name);
    return activeQuizData;
  } catch (error) {
    console.error('Error activating scheduled quiz:', error);
    throw error;
  }
};
export const isStudentInWaitingRoom = async (studentName) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const activeQuiz = activeQuizDoc.data();
      const waitingParticipants = activeQuiz.waitingParticipants || [];
      return waitingParticipants.includes(studentName);
    }
    return false;
  } catch (error) {
    console.error('Error checking waiting room status:', error);
    return false;
  }
};

// Join waiting room for scheduled quiz
export const joinScheduledQuizWaitingRoom = async (quizId, studentName) => {
  try {
    console.log('🚀 Joining scheduled quiz:', quizId, studentName);
    
    // Get the scheduled quiz
    const quiz = await getScheduledQuizById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    let activeQuiz;
    
    if (!activeQuizDoc.exists() || activeQuizDoc.data().status === 'inactive') {
      console.log('🆕 Creating new waiting room from scheduled quiz');
      
      // FIX: Ensure quiz has valid questions before activating
      if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        throw new Error('Quiz has no valid questions');
      }
      
      activeQuiz = {
        ...quiz,
        originalQuizId: quiz.id,
        quizStartTime: null, // No auto-start timer
        currentQuestionIndex: 0,
        totalParticipants: 1, // Start with 1 for this student
        waitingParticipants: [studentName],
        status: 'waiting',
        lastUpdated: serverTimestamp(),
        isFromScheduled: true
      };

      await setDoc(activeQuizRef, activeQuiz);
      
      // Update scheduled quiz status
      await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
        status: 'activated',
        activatedAt: serverTimestamp()
      });
      
    } else {
      // Add student to existing waiting room
      console.log('➕ Adding student to existing waiting room');
      const currentData = activeQuizDoc.data();
      const currentParticipants = currentData.waitingParticipants || [];
      
      if (!currentParticipants.includes(studentName)) {
        const updatedParticipants = [...currentParticipants, studentName];
        await updateDoc(activeQuizRef, {
          waitingParticipants: updatedParticipants,
          totalParticipants: (currentData.totalParticipants || 0) + 1,
          lastUpdated: serverTimestamp()
        });
      }
      
      activeQuiz = { id: activeQuizDoc.id, ...currentData };
    }

    console.log('✅ Successfully joined waiting room');
    return { success: true, quiz: activeQuiz };
    
  } catch (error) {
    console.error('❌ Error joining scheduled quiz waiting room:', error);
    throw error;
  }
};
// Delete quiz from Firestore
export const deleteQuizFromFirestore = async (quizId) => {
  try {
    await deleteDoc(doc(db, QUIZZES_COLLECTION, quizId));
    console.log('✅ Quiz deleted:', quizId);
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

// Set active quiz with waiting room
// Set active quiz with waiting room
export const setActiveQuiz = async (quiz) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
    const activeQuizData = {
      ...quiz,
      originalQuizId: quiz.id,
      quizStartTime: null, // ← CHANGE THIS: Remove auto-start timer
      currentQuestionIndex: 0,
      totalParticipants: 0,
      waitingParticipants: quiz.waitingParticipants || [],
      status: 'waiting',
      lastUpdated: serverTimestamp(),
      isFromScheduled: quiz.isFromScheduled || false
    };

    console.log('🚀 Setting active quiz to waiting room:', quiz.name);
    
    await setDoc(activeQuizRef, activeQuizData);
    console.log('✅ Active quiz set to waiting room:', quiz.name);
    return activeQuizData;
  } catch (error) {
    console.error('Error setting active quiz:', error);
    throw error;
  }
};
// Get active quiz
export const getActiveQuizFromFirestore = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const docSnap = await getDoc(activeQuizRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { id: docSnap.id, ...data };
    }
    return null;
  } catch (error) {
    console.error('Error getting active quiz:', error);
    return null;
  }
};

// Real-time listener for active quiz
export const listenToActiveQuiz = (callback) => {
  const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
  
  return onSnapshot(activeQuizRef, (docSnap) => {
    if (docSnap.exists()) {
      const quizData = { id: docSnap.id, ...docSnap.data() };
      console.log('🎯 REAL-TIME UPDATE - Quiz Status:', quizData.status, 'Start Time:', quizData.quizStartTime);
      callback(quizData);
    } else {
      console.log('🎯 REAL-TIME UPDATE - No active quiz');
      callback(null);
    }
  });
};

// Update current question index
export const updateCurrentQuestion = async (newIndex) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    await updateDoc(activeQuizRef, {
      currentQuestionIndex: newIndex,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating current question:', error);
    throw error;
  }
};

// Save top 5 rankings to class results when quiz ends
export const saveTopRankingsToClass = async (quiz) => {
  try {
    // Get top 5 results for this quiz
    const resultsQuery = query(
      collection(db, RESULTS_COLLECTION),
      where('quizId', '==', quiz.id),
      orderBy('score', 'desc'),
      limit(5)
    );
    
    const resultsSnapshot = await getDocs(resultsQuery);
    const topRankings = [];
    resultsSnapshot.forEach(doc => {
      const data = doc.data();
      topRankings.push({
        studentName: data.studentName,
        score: data.score,
        percentage: data.percentage,
        totalQuestions: data.totalQuestions
      });
    });

    // Save to class results collection
    const classResultData = {
      quizId: quiz.id,
      quizName: quiz.name,
      quizClass: quiz.class,
      topRankings: topRankings,
      totalParticipants: topRankings.length,
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, CLASS_RESULTS_COLLECTION), classResultData);
    console.log('🏆 Top 5 rankings saved to class results:', quiz.name);
    return topRankings;
  } catch (error) {
    console.error('Error saving top rankings to class:', error);
    throw error;
  }
};

// Enhanced end active quiz function
// Enhanced end active quiz function
export const endActiveQuiz = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const activeQuiz = { id: activeQuizDoc.id, ...activeQuizDoc.data() };
      
      console.log('🎯 Ending quiz:', activeQuiz);
      
      // Save top rankings to class results before ending
      if (activeQuiz.id && activeQuiz.name) {
        await saveTopRankingsToClass(activeQuiz);
        
        // Mark the original quiz as completed and remove from scheduled
        if (activeQuiz.originalQuizId) {
          const originalQuizRef = doc(db, QUIZZES_COLLECTION, activeQuiz.originalQuizId);
          await updateDoc(originalQuizRef, {
            status: 'completed',
            endedAt: serverTimestamp()
          });
        }
      }
      
      // Clear active quiz - this will trigger the real-time listeners
      await setDoc(activeQuizRef, {
        status: 'inactive',
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Quiz ended and rankings saved to class results');
    }
  } catch (error) {
    console.error('Error ending quiz:', error);
    throw error;
  }
};

// Pause quiz
export const pauseQuiz = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const currentData = activeQuizDoc.data();
      await updateDoc(activeQuizRef, {
        status: 'paused',
        pauseStartTime: Date.now(),
        lastUpdated: serverTimestamp()
      });
      console.log('⏸️ Quiz paused');
    }
  } catch (error) {
    console.error('Error pausing quiz:', error);
    throw error;
  }
};

// Resume quiz
export const resumeQuiz = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const currentData = activeQuizDoc.data();
      const pauseDuration = Date.now() - (currentData.pauseStartTime || Date.now());
      const newQuizStartTime = currentData.quizStartTime + pauseDuration;
      
      await updateDoc(activeQuizRef, {
        status: 'active',
        quizStartTime: newQuizStartTime,
        lastUpdated: serverTimestamp()
      });
      console.log('▶️ Quiz resumed');
    }
  } catch (error) {
    console.error('Error resuming quiz:', error);
    throw error;
  }
};

// Start quiz from waiting room (after countdown)
export const startQuizFromWaitingRoom = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      await updateDoc(activeQuizRef, {
        status: 'active',
        quizStartTime: Date.now(), // Start now
        lastUpdated: serverTimestamp()
      });
      
      console.log('🚀 Quiz started from waiting room');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error starting quiz from waiting room:', error);
    throw error;
  }
};

// Add student to waiting room
export const addStudentToWaitingRoom = async (studentName) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (!activeQuizDoc.exists()) {
      return [];
    }

    const currentData = activeQuizDoc.data();
    const currentParticipants = currentData.waitingParticipants || [];
    
    // Check if student already in waiting room
    if (currentParticipants.includes(studentName)) {
      return currentParticipants;
    }

    const updatedParticipants = [...currentParticipants, studentName];
    
    await updateDoc(activeQuizRef, {
      waitingParticipants: updatedParticipants,
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Student added to waiting room:', studentName);
    return updatedParticipants;
    
  } catch (error) {
    console.error('Error adding student to waiting room:', error);
    throw error;
  }
};

// Get student result
export const getStudentResult = async (quizId, studentName) => {
  try {
    const q = query(
      collection(db, RESULTS_COLLECTION), 
      where('quizId', '==', quizId),
      where('studentName', '==', studentName)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting student result:', error);
    return null;
  }
};

// Clean answers array
const cleanAnswersArray = (answers) => {
  if (!answers) return [];
  return answers.map(answer => answer === undefined ? '' : answer);
};

// Save or update quiz result
export const saveOrUpdateQuizResult = async (result) => {
  try {
    // Clean the answers array before saving
    const cleanedResult = {
      ...result,
      answers: cleanAnswersArray(result.answers)
    };

    const existingResult = await getStudentResult(cleanedResult.quizId, cleanedResult.studentName);
    
    if (existingResult) {
      // Update existing result
      const resultRef = doc(db, RESULTS_COLLECTION, existingResult.id);
      await updateDoc(resultRef, {
        score: cleanedResult.score,
        percentage: cleanedResult.percentage,
        answers: cleanedResult.answers,
        updatedAt: serverTimestamp(),
        completedAt: cleanedResult.completedAt || existingResult.completedAt,
        lastQuestionAnswered: cleanedResult.currentQuestionIndex || existingResult.lastQuestionAnswered
      });
      console.log('✅ Updated existing result for:', cleanedResult.studentName);
      return { id: existingResult.id, ...cleanedResult };
    } else {
      // Create new result
      const resultWithTimestamp = {
        ...cleanedResult,
        submittedAt: serverTimestamp(),
        joinTime: cleanedResult.joinTime || Date.now(),
        updatedAt: serverTimestamp(),
        lastQuestionAnswered: cleanedResult.currentQuestionIndex || 0
      };
      
      const docRef = await addDoc(collection(db, RESULTS_COLLECTION), resultWithTimestamp);
      
      // Only increment participant count for NEW participants
      await incrementParticipantCount();
      
      console.log('✅ Created new result for:', cleanedResult.studentName);
      return { id: docRef.id, ...cleanedResult };
    }
  } catch (error) {
    console.error('Error saving/updating result:', error);
    throw error;
  }
};

// Increment participant count
export const incrementParticipantCount = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const currentData = activeQuizDoc.data();
      await updateDoc(activeQuizRef, {
        totalParticipants: (currentData.totalParticipants || 0) + 1,
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error incrementing participant count:', error);
  }
};

// Get quiz results
// Get quiz results - ensure proper query


export const getQuizResultsFromFirestore = async (quizId) => {
  try {
    const q = query(
      collection(db, RESULTS_COLLECTION), 
      where('quizId', '==', quizId)
      // Remove orderBy if it causes issues, we'll sort manually
    );
    
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({ 
        id: doc.id, 
        ...data,
        // Ensure score is a number
        score: Number(data.score) || 0,
        percentage: Number(data.percentage) || 0
      });
    });
    
    // Sort manually by score descending
    return results.sort((a, b) => (b.score || 0) - (a.score || 0));
  } catch (error) {
    console.error('Error getting quiz results:', error);
    throw error;
  }
};

// Real-time listener for quiz results
export const listenToQuizResults = (quizId, callback) => {
  const q = query(
    collection(db, RESULTS_COLLECTION), 
    where('quizId', '==', quizId),
    orderBy('score', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    callback(results);
  });
};

// Get all scheduled quizzes
export const getQuizzesFromFirestore = async () => {
  try {
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where('status', 'in', ['scheduled', 'draft']), // Only show scheduled/draft, not ended
      orderBy('scheduledTime', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() });
    });
    return quizzes;
  } catch (error) {
    console.error('Error getting quizzes:', error);
    throw error;
  }
};

// Get class results (top 5 rankings by class)
export const getClassResults = async () => {
  try {
    const q = query(
      collection(db, CLASS_RESULTS_COLLECTION),
      orderBy('completedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const classResults = [];
    querySnapshot.forEach((doc) => {
      classResults.push({ id: doc.id, ...doc.data() });
    });
    return classResults;
  } catch (error) {
    console.error('Error getting class results:', error);
    throw error;
  }
};

// Get all class results including completed ones
export const getAllClassResults = async () => {
  try {
    const q = query(
      collection(db, CLASS_RESULTS_COLLECTION),
      orderBy('completedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const classResults = [];
    querySnapshot.forEach((doc) => {
      classResults.push({ id: doc.id, ...doc.data() });
    });
    return classResults;
  } catch (error) {
    console.error('Error getting class results:', error);
    throw error;
  }
};
export const getAllScheduledQuizzes = async () => {
  try {
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where('status', 'in', ['scheduled', 'activated']), // Include activated but not started
      orderBy('scheduledTime', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    
    querySnapshot.forEach((doc) => {
      quizzes.push({ 
        id: doc.id, 
        ...doc.data()
      });
    });
    
    console.log(`📅 Found ${quizzes.length} scheduled/activated quizzes`);
    return quizzes;
  } catch (error) {
    console.error('Error getting all scheduled quizzes:', error);
    return [];
  }
};
// Get scheduled quizzes for students
// Enhanced getScheduledQuizzes with better error handling
export const getScheduledQuizzes = async () => {
  try {
    const now = Date.now();
    
    // FIX: Use simpler query to avoid Firestore errors
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where('status', '==', 'scheduled'),
      orderBy('scheduledTime', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    
    querySnapshot.forEach((doc) => {
      const quizData = doc.data();
      // FIX: Filter by time on client side to avoid complex queries
      if (quizData.scheduledTime && quizData.scheduledTime > now) {
        quizzes.push({ 
          id: doc.id, 
          ...quizData
        });
      }
    });
    
    console.log(`📅 Found ${quizzes.length} scheduled quizzes`);
    return quizzes;
  } catch (error) {
    console.error('Error getting scheduled quizzes:', error);
    // Return empty array to prevent UI crashes
    return [];
  }
};

// Delete class result
export const deleteClassResult = async (resultId) => {
  try {
    await deleteDoc(doc(db, CLASS_RESULTS_COLLECTION, resultId));
    console.log('🗑️ Class result deleted:', resultId);
    return true;
  } catch (error) {
    console.error('Error deleting class result:', error);
    throw error;
  }
};
// Add these functions to your existing firestore.js

export const saveQuizResults = async (quizId, studentId, resultData) => {
  try {
    // Save to student's results
    const studentResultRef = doc(db, 'students', studentId, 'results', quizId);
    await setDoc(studentResultRef, resultData);

    // Save to class results
    const classResultRef = doc(db, 'quizzes', quizId, 'results', studentId);
    await setDoc(classResultRef, resultData);

    console.log('✅ Results saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving results:', error);
    throw error;
  }
};

export const calculateRankings = async (quizId, studentId, score, timestamp) => {
  try {
    const resultsSnapshot = await getDocs(collection(db, 'quizzes', quizId, 'results'));
    const allResults = [];
    
    resultsSnapshot.forEach(doc => {
      const data = doc.data();
      allResults.push({
        studentId: data.studentId,
        score: data.score,
        timestamp: data.timestamp
      });
    });

    // Sort by score (descending) and timestamp (ascending for tie-breaker)
    const sortedResults = allResults.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timestamp - b.timestamp;
    });

    const rank = sortedResults.findIndex(result => result.studentId === studentId) + 1;
    const totalParticipants = sortedResults.length;

    return { rank, totalParticipants };
  } catch (error) {
    console.error('❌ Error calculating rankings:', error);
    throw error;
  }
};