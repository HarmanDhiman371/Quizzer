import { 
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

const QUIZZES_COLLECTION = 'quizzes';
const ACTIVE_QUIZ_COLLECTION = 'activeQuiz';
const RESULTS_COLLECTION = 'results';

// Initialize active quiz document (run once)
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
      status: quiz.status || 'scheduled',
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

// Set active quiz
export const setActiveQuiz = async (quiz) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
    const activeQuizData = {
      ...quiz,
      quizStartTime: Date.now(),
      currentQuestionIndex: 0,
      totalParticipants: 0,
      status: 'active',
      lastUpdated: serverTimestamp()
    };

    console.log('🚀 Setting active quiz:', activeQuizData);
    
    await setDoc(activeQuizRef, activeQuizData);
    console.log('✅ Active quiz set:', quiz.name);
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

// End active quiz
export const endActiveQuiz = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    await updateDoc(activeQuizRef, {
      status: 'completed',
      endTime: Date.now(),
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error ending quiz:', error);
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

// Clean answers array - replace undefined with empty strings
const cleanAnswersArray = (answers) => {
  if (!answers) return [];
  return answers.map(answer => answer === undefined ? '' : answer);
};

// Save or update quiz result - FIXED VERSION
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
      console.log('✅ Updated existing result for:', cleanedResult.studentName, 'Score:', cleanedResult.score);
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
      
      console.log('✅ Created new result for:', cleanedResult.studentName, 'Score:', cleanedResult.score);
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

// Get all quizzes
export const getQuizzesFromFirestore = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, QUIZZES_COLLECTION));
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

// Get scheduled quizzes
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
// Add these functions to your existing firestore.js

// Set quiz to waiting room state
export const setQuizToWaitingRoom = async (quiz) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
    const waitingRoomData = {
      ...quiz,
      status: 'waiting',
      scheduledTime: quiz.scheduledTime,
      waitingParticipants: [],
      lastUpdated: serverTimestamp()
    };

    console.log('🚪 Setting quiz to waiting room:', quiz.name);
    
    await setDoc(activeQuizRef, waitingRoomData);
    return waitingRoomData;
  } catch (error) {
    console.error('Error setting waiting room:', error);
    throw error;
  }
};

// Add student to waiting room
export const addStudentToWaitingRoom = async (studentName) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    let currentParticipants = []; // ✅ define here

    if (activeQuizDoc.exists()) {
      const currentData = activeQuizDoc.data();
      currentParticipants = currentData.waitingParticipants || [];
      
      // Check if student already in waiting room
      if (!currentParticipants.includes(studentName)) {
        const updatedParticipants = [...currentParticipants, studentName];
        
        await updateDoc(activeQuizRef, {
          waitingParticipants: updatedParticipants,
          lastUpdated: serverTimestamp()
        });
        
        console.log('✅ Student added to waiting room:', studentName);
        return updatedParticipants;
      }
    }
    return currentParticipants; // ✅ now always defined
  } catch (error) {
    console.error('Error adding student to waiting room:', error);
    throw error;
  }
};


// Start quiz from waiting room
export const startQuizFromWaitingRoom = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const currentData = activeQuizDoc.data();
      
      await updateDoc(activeQuizRef, {
        status: 'starting', // 5-second countdown state
        quizStartTime: Date.now() + 5000, // Start in 5 seconds
        lastUpdated: serverTimestamp()
      });
      
      console.log('🚀 Quiz starting in 5 seconds...');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error starting quiz from waiting room:', error);
    throw error;
  }
};