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
export const setActiveQuiz = async (quiz) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
    const activeQuizData = {
      ...quiz,
      quizStartTime: Date.now() + 10000, // Start in 10 seconds
      currentQuestionIndex: 0,
      totalParticipants: 0,
      waitingParticipants: [],
      status: 'waiting', // Start in waiting room
      lastUpdated: serverTimestamp()
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
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
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
export const endActiveQuiz = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const activeQuiz = activeQuizDoc.data();
      
      // Save top rankings to class results before ending
      if (activeQuiz.id) {
        await saveTopRankingsToClass(activeQuiz);
      }
      
      // Clear active quiz
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
export const getQuizResultsFromFirestore = async (quizId) => {
  try {
    const q = query(
      collection(db, RESULTS_COLLECTION), 
      where('quizId', '==', quizId),
      orderBy('score', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
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
      where('status', '==', 'scheduled'),
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

// Get scheduled quizzes for students
export const getScheduledQuizzes = async () => {
  try {
    const now = Date.now();
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where('status', '==', 'scheduled'),
      where('scheduledTime', '>', now),
      orderBy('scheduledTime', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() });
    });
    return quizzes;
  } catch (error) {
    console.error('Error getting scheduled quizzes:', error);
    throw error;
  }
};