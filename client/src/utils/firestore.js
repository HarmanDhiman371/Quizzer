import { 
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, setDoc, limit
} from 'firebase/firestore';
import { db } from '../firebase/config';

const QUIZZES_COLLECTION = 'quizzes';
const ACTIVE_QUIZ_COLLECTION = 'activeQuiz';
const RESULTS_COLLECTION = 'results';
const CLASS_RESULTS_COLLECTION = 'classResults';
const COMPLETE_RESULTS_COLLECTION = 'completeQuizResults';

// ==================== QUIZ MANAGEMENT ====================
export const initializeActiveQuiz = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const docSnap = await getDoc(activeQuizRef);
    
    if (!docSnap.exists()) {
      await setDoc(activeQuizRef, {
        status: 'inactive',
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error initializing active quiz:', error);
  }
};

export const saveQuizToFirestore = async (quiz) => {
  try {
    const quizWithTimestamp = {
      ...quiz,
      passkey: quiz.passkey || '', // NEW: Ensure passkey is included
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'scheduled'
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
      const data = quizDoc.data();
      return { 
        id: quizDoc.id, 
        ...data,
        passkey: data.passkey || '' // Ensure passkey field exists
      };
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
      originalQuizId: quiz.id, // PRESERVE ORIGINAL ID
      quizStartTime: null,
      currentQuestionIndex: 0,
      totalParticipants: 0,
      waitingParticipants: [],
      status: 'waiting',
      lastUpdated: serverTimestamp(),
      isFromScheduled: true
    };

    await setDoc(activeQuizRef, activeQuizData);
    
    await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
      status: 'activated',
      activatedAt: serverTimestamp()
    });
    
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
export const joinScheduledQuizWithPasskey = async (quizId, studentName, enteredPasskey = '') => {
  try {
    const quiz = await getScheduledQuizById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Verify passkey if quiz has one
    if (quiz.passkey && quiz.passkey.trim() !== '') {
      if (!enteredPasskey || quiz.passkey !== enteredPasskey.trim()) {
        throw new Error('Invalid passkey');
      }
    }

    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    let activeQuiz;
    
    if (!activeQuizDoc.exists() || activeQuizDoc.data().status === 'inactive') {
      activeQuiz = {
        ...quiz,
        originalQuizId: quiz.id,
        quizStartTime: null,
        currentQuestionIndex: 0,
        totalParticipants: 1,
        waitingParticipants: [studentName],
        status: 'waiting', // Keep as 'waiting'
        lastUpdated: serverTimestamp(),
        isFromScheduled: true
      };

      await setDoc(activeQuizRef, activeQuiz);
      
      // 🚨 REMOVED THE AUTOMATIC STATUS UPDATE HERE TOO 🚨
      // Don't change the scheduled quiz status automatically
      // await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
      //   status: 'activated',
      //   activatedAt: serverTimestamp()
      // });
      
    } else {
      const currentData = activeQuizDoc.data();
      
      if (currentData.status === 'active') {
        throw new Error('Quiz has already started. Cannot join now.');
      }
      
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

    return { success: true, quiz: activeQuiz };
    
  } catch (error) {
    console.error('Error joining scheduled quiz with passkey:', error);
    throw error;
  }
};
export const verifyActiveQuizPasskey = async (enteredPasskey) => {
  try {
    const activeQuiz = await getActiveQuizFromFirestore();
    if (!activeQuiz) {
      return { valid: false, message: 'No active quiz found' };
    }

    // If active quiz has no passkey, allow access
    if (!activeQuiz.passkey || activeQuiz.passkey.trim() === '') {
      return { valid: true, quiz: activeQuiz };
    }

    // Compare passkeys (case-sensitive)
    const isValid = activeQuiz.passkey === enteredPasskey.trim();
    
    return { 
      valid: isValid, 
      quiz: isValid ? activeQuiz : null,
      message: isValid ? 'Passkey verified' : 'Invalid passkey'
    };
  } catch (error) {
    console.error('Error verifying active quiz passkey:', error);
    return { valid: false, quiz: null, message: error.message };
  }
};
export const verifyQuizPasskey = async (quizId, enteredPasskey) => {
  try {
    const quiz = await getScheduledQuizById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // If quiz has no passkey, allow access
    if (!quiz.passkey || quiz.passkey.trim() === '') {
      return { valid: true, quiz: quiz };
    }

    // Compare passkeys (case-sensitive)
    const isValid = quiz.passkey === enteredPasskey.trim();
    
    return { 
      valid: isValid, 
      quiz: isValid ? quiz : null,
      message: isValid ? 'Passkey verified' : 'Invalid passkey'
    };
  } catch (error) {
    console.error('Error verifying passkey:', error);
    return { valid: false, quiz: null, message: error.message };
  }
};
export const joinScheduledQuizWaitingRoom = async (quizId, studentName) => {
  try {
    const quiz = await getScheduledQuizById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    let activeQuiz;
    
    if (!activeQuizDoc.exists() || activeQuizDoc.data().status === 'inactive') {
      activeQuiz = {
        ...quiz,
        originalQuizId: quiz.id,
        quizStartTime: null,
        currentQuestionIndex: 0,
        totalParticipants: 1,
        waitingParticipants: [studentName],
        status: 'waiting', // Keep as 'waiting'
        lastUpdated: serverTimestamp(),
        isFromScheduled: true
      };

      await setDoc(activeQuizRef, activeQuiz);
      
      // 🚨 REMOVED THE AUTOMATIC STATUS UPDATE 🚨
      // Don't change the scheduled quiz status - wait for admin to start manually
      // await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
      //   status: 'activated', // ← THIS WAS THE BUG!
      //   activatedAt: serverTimestamp()
      // });
      
    } else {
      const currentData = activeQuizDoc.data();
      
      if (currentData.status === 'active') {
        throw new Error('Quiz has already started. Cannot join now.');
      }
      
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

    return { success: true, quiz: activeQuiz };
    
  } catch (error) {
    console.error('Error joining scheduled quiz waiting room:', error);
    throw error;
  }
};

export const deleteQuizFromFirestore = async (quizId) => {
  try {
    await deleteDoc(doc(db, QUIZZES_COLLECTION, quizId));
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

export const setActiveQuiz = async (quiz) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
    const activeQuizData = {
      ...quiz,
      originalQuizId: quiz.id, // PRESERVE ORIGINAL ID
      quizStartTime: null,
      currentQuestionIndex: 0,
      totalParticipants: 0,
      waitingParticipants: quiz.waitingParticipants || [],
      status: 'waiting',
      lastUpdated: serverTimestamp(),
      isFromScheduled: quiz.isFromScheduled || false
    };

    await setDoc(activeQuizRef, activeQuizData);
    return activeQuizData;
  } catch (error) {
    console.error('Error setting active quiz:', error);
    throw error;
  }
};

export const getActiveQuizFromFirestore = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const docSnap = await getDoc(activeQuizRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        passkey: data.passkey || '' // Ensure passkey field exists
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting active quiz:', error);
    return null;
  }
};

export const listenToActiveQuiz = (callback) => {
  const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
  
  return onSnapshot(activeQuizRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const quizData = { 
        id: docSnap.id, 
        ...data,
        passkey: data.passkey || '' // Ensure passkey field exists
      };
      callback(quizData);
    } else {
      callback(null);
    }
  });
};

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

// FIXED: End quiz with proper ID preservation
// FIXED: End quiz with proper status updates
export const endActiveQuiz = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const activeQuiz = { id: activeQuizDoc.id, ...activeQuizDoc.data() };
      
      console.log('🎯 Ending quiz:', activeQuiz.name, 'Questions:', activeQuiz.questions?.length);
      
      const quizIdToSave = activeQuiz.originalQuizId || activeQuiz.id;
      
      // FIX: Update scheduled quiz status to 'completed'
      if (activeQuiz.isFromScheduled && activeQuiz.originalQuizId) {
        try {
          const scheduledQuizRef = doc(db, QUIZZES_COLLECTION, activeQuiz.originalQuizId);
          await updateDoc(scheduledQuizRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            finalParticipants: activeQuiz.totalParticipants || 0
          });
          console.log('✅ Updated scheduled quiz status to completed');
        } catch (error) {
          console.error('Error updating scheduled quiz status:', error);
        }
      }
      
      if (quizIdToSave && activeQuiz.name) {
        await saveTopRankingsToClass({
          ...activeQuiz,
          id: quizIdToSave
        });
        
        await saveCompleteQuizResults({
          ...activeQuiz,
          id: quizIdToSave
        });
      }
      
      // Preserve ALL necessary data for students
      await setDoc(activeQuizRef, {
        status: 'inactive',
        originalQuizId: activeQuiz.originalQuizId,
        quizName: activeQuiz.name,
        quizClass: activeQuiz.class,
        questions: activeQuiz.questions,
        totalQuestions: activeQuiz.questions?.length,
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Quiz ended. Preserved questions:', activeQuiz.questions?.length);
    }
  } catch (error) {
    console.error('Error ending quiz:', error);
    throw error;
  }
};

export const pauseQuiz = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      await updateDoc(activeQuizRef, {
        status: 'paused',
        pauseStartTime: Date.now(),
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error pausing quiz:', error);
    throw error;
  }
};

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
    }
  } catch (error) {
    console.error('Error resuming quiz:', error);
    throw error;
  }
};

// In firestore.js - Enhance startQuizFromWaitingRoom to ensure proper status update
export const startQuizFromWaitingRoom = async () => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      await updateDoc(activeQuizRef, {
        status: 'active',
        quizStartTime: Date.now(),
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Quiz started - Entry closed for latecomers');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error starting quiz from waiting room:', error);
    throw error;
  }
};

export const addStudentToWaitingRoom = async (studentName) => {
  try {
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (!activeQuizDoc.exists()) {
      return [];
    }

    const currentData = activeQuizDoc.data();
    const currentParticipants = currentData.waitingParticipants || [];
    
    if (currentParticipants.includes(studentName)) {
      return currentParticipants;
    }

    const updatedParticipants = [...currentParticipants, studentName];
    
    await updateDoc(activeQuizRef, {
      waitingParticipants: updatedParticipants,
      lastUpdated: serverTimestamp()
    });
    
    return updatedParticipants;
    
  } catch (error) {
    console.error('Error adding student to waiting room:', error);
    throw error;
  }
};

// ==================== RESULTS MANAGEMENT ====================
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
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        score: Number(data.score) || 0,
        percentage: Number(data.percentage) || 0,
        tabSwitches: Number(data.tabSwitches) || 0
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting student result:', error);
    return null;
  }
};

const cleanAnswersArray = (answers) => {
  if (!answers) return [];
  return answers.map(answer => answer === undefined ? '' : answer);
};

export const saveOrUpdateQuizResult = async (result) => {
  try {
    const cleanedResult = {
      ...result,
      answers: cleanAnswersArray(result.answers),
      tabSwitches: result.tabSwitches || 0,
      totalQuestions: result.totalQuestions || (result.answers ? result.answers.length : 0) || 1,
      lastActivity: serverTimestamp(),
      quizId: result.quizId,
      quizName: result.quizName,
      quizClass: result.quizClass || 'Unknown Class'
    };

    const existingResult = await getStudentResult(cleanedResult.quizId, cleanedResult.studentName);
    
    if (existingResult) {
      if (existingResult.completedAt && cleanedResult.completedAt) {
        return { id: existingResult.id, ...existingResult };
      }
      
      const resultRef = doc(db, RESULTS_COLLECTION, existingResult.id);
      await updateDoc(resultRef, {
        score: cleanedResult.score,
        percentage: cleanedResult.percentage,
        totalQuestions: cleanedResult.totalQuestions,
        answers: cleanedResult.answers,
        updatedAt: serverTimestamp(),
        completedAt: cleanedResult.completedAt || existingResult.completedAt,
        lastQuestionAnswered: cleanedResult.currentQuestionIndex || existingResult.lastQuestionAnswered,
        tabSwitches: cleanedResult.tabSwitches,
        lastActivity: cleanedResult.lastActivity,
        quizName: cleanedResult.quizName,
        quizClass: cleanedResult.quizClass
      });
      return { id: existingResult.id, ...cleanedResult };
    } else {
      const resultWithTimestamp = {
        ...cleanedResult,
        submittedAt: serverTimestamp(),
        joinTime: cleanedResult.joinTime || Date.now(),
        updatedAt: serverTimestamp(),
        lastQuestionAnswered: cleanedResult.currentQuestionIndex || 0
      };
      
      const docRef = await addDoc(collection(db, RESULTS_COLLECTION), resultWithTimestamp);
      await incrementParticipantCount();
      return { id: docRef.id, ...cleanedResult };
    }
  } catch (error) {
    console.error('Error saving/updating result:', error);
    throw error;
  }
};

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

export const getQuizResultsFromFirestore = async (quizId) => {
  try {
    const q = query(
      collection(db, RESULTS_COLLECTION), 
      where('quizId', '==', quizId)
    );
    
    const querySnapshot = await getDocs(q);
    const results = [];
    const seenStudents = new Set();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const studentKey = data.studentName;
      
      if (!seenStudents.has(studentKey)) {
        seenStudents.add(studentKey);
        
        const totalQuestions = data.totalQuestions || (data.answers ? data.answers.length : 0) || 1;
        const score = Number(data.score) || 0;
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        
        results.push({ 
          id: doc.id, 
          ...data,
          score: score,
          totalQuestions: totalQuestions,
          percentage: percentage,
          tabSwitches: Number(data.tabSwitches) || 0,
          quizId: data.quizId,
          quizName: data.quizName
        });
      }
    });
    
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.completedAt || 0) - (b.completedAt || 0);
    });
    
    return results;
  } catch (error) {
    console.error('Error getting quiz results:', error);
    throw error;
  }
};

export const listenToQuizResults = (quizId, callback) => {
  const q = query(
    collection(db, RESULTS_COLLECTION), 
    where('quizId', '==', quizId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const results = [];
    const seenStudents = new Set();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const studentKey = data.studentName;
      
      if (!seenStudents.has(studentKey)) {
        seenStudents.add(studentKey);
        results.push({ 
          id: doc.id, 
          ...data,
          score: Number(data.score) || 0,
          percentage: Number(data.percentage) || 0,
          tabSwitches: Number(data.tabSwitches) || 0
        });
      }
    });
    
    callback(results);
  });
};

export const getQuizzesFromFirestore = async () => {
  try {
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where('status', 'in', ['scheduled', 'draft']),
      orderBy('scheduledTime', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      const quizData = doc.data();
      // FIX: Exclude completed quizzes
      if (quizData.status !== 'completed') {
        quizzes.push({ id: doc.id, ...quizData });
      }
    });
    console.log('📚 Loaded quizzes for management:', quizzes.length);
    return quizzes;
  } catch (error) {
    console.error('Error getting quizzes:', error);
    throw error;
  }
};

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

export const getAllScheduledQuizzes = async () => {
  try {
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where('status', 'in', ['scheduled', 'activated']),
      orderBy('scheduledTime', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    
    querySnapshot.forEach((doc) => {
      const quizData = doc.data();
      if (quizData.status !== 'completed') {
        quizzes.push({ 
          id: doc.id, 
          ...quizData,
          passkey: quizData.passkey || '' // Ensure passkey field exists
        });
      }
    });
    
    console.log('📅 Loaded scheduled quizzes:', quizzes.length);
    return quizzes;
  } catch (error) {
    console.error('Error getting all scheduled quizzes:', error);
    return [];
  }
};
export const getAllQuizResultsForAdmin = async (quizId) => {
  try {
    const results = await getQuizResultsFromFirestore(quizId);
    return results;
  } catch (error) {
    console.error('Error getting all results for admin:', error);
    throw error;
  }
};
// NEW: Function to manually clean up old/completed quizzes
export const cleanupCompletedQuizzes = async () => {
  try {
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where('status', '==', 'completed')
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = [];
    
    querySnapshot.forEach((doc) => {
      console.log('🗑️ Deleting completed quiz:', doc.id, doc.data().name);
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Cleaned up ${deletePromises.length} completed quizzes`);
    return deletePromises.length;
  } catch (error) {
    console.error('Error cleaning up completed quizzes:', error);
    throw error;
  }
};
export const getAllClassResults = async () => {
  try {
    const q = query(
      collection(db, CLASS_RESULTS_COLLECTION),
      orderBy('completedAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const classResults = [];
    const seenQuizzes = new Set();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const quizKey = data.quizId;
      
      if (!seenQuizzes.has(quizKey)) {
        seenQuizzes.add(quizKey);
        classResults.push({ id: doc.id, ...data });
      }
    });
    
    return classResults;
  } catch (error) {
    console.error('Error getting class results:', error);
    throw error;
  }
};

export const getScheduledQuizzes = async () => {
  try {
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where('status', 'in', ['scheduled', 'activated']),
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
    
    return quizzes;
  } catch (error) {
    console.error('Error getting scheduled quizzes:', error);
    return [];
  }
};

// FIXED: Enhanced delete function with better debugging
export const deleteClassResult = async (resultId) => {
  try {
    if (!resultId) {
      throw new Error('Result ID is required for deletion');
    }
    
    console.log('🗑️ Attempting to delete result:', resultId);
    
    const resultRef = doc(db, CLASS_RESULTS_COLLECTION, resultId);
    const resultDoc = await getDoc(resultRef);
    
    if (!resultDoc.exists()) {
      throw new Error(`Result with ID ${resultId} not found in database`);
    }
    
    console.log('📄 Found document to delete:', resultDoc.data().quizName);
    
    await deleteDoc(resultRef);
    console.log('✅ Result deleted successfully from Firestore');
    return true;
  } catch (error) {
    console.error('❌ Error deleting class result:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to delete result: ${error.message}`);
  }
};

export const updateTabSwitchCount = async (quizId, studentName, switchCount) => {
  try {
    console.log('🔄 Updating tab switch count:', { quizId, studentName, switchCount });
    
    const existingResult = await getStudentResult(quizId, studentName);
    
    if (existingResult) {
      const resultRef = doc(db, RESULTS_COLLECTION, existingResult.id);
      await updateDoc(resultRef, {
        tabSwitches: switchCount,
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastTabUpdate: Date.now()
      });
      console.log('✅ Tab switch count updated:', switchCount);
    } else {
      // Create a new result document if none exists
      console.log('📝 No existing result found, creating new one for tab tracking');
      await saveOrUpdateQuizResult({
        studentName: studentName,
        quizId: quizId,
        tabSwitches: switchCount,
        score: 0,
        totalQuestions: 0,
        percentage: 0,
        answers: [],
        lastActivity: serverTimestamp(),
        lastTabUpdate: Date.now()
      });
    }
  } catch (error) {
    console.error('❌ Error updating tab switch count:', error);
  }
};

// FIXED: Save top rankings with correct quiz ID
const saveTopRankingsToClass = async (quiz) => {
  try {
    const results = await getQuizResultsFromFirestore(quiz.id);
    const topRankings = results.slice(0, 5).map((result, index) => ({
      studentName: result.studentName,
      score: result.score,
      percentage: result.percentage,
      totalQuestions: result.totalQuestions,
      tabSwitches: result.tabSwitches || 0
    }));

    const classResultData = {
      quizId: quiz.id, // Use correct quiz ID
      quizName: quiz.name,
      quizClass: quiz.class,
      topRankings: topRankings,
      totalParticipants: topRankings.length,
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      sessionId: `${quiz.id}_${Date.now()}`
    };

    await addDoc(collection(db, CLASS_RESULTS_COLLECTION), classResultData);
    console.log('🏆 Top rankings saved for quiz:', quiz.name, 'ID:', quiz.id);
    return topRankings;
  } catch (error) {
    console.error('Error saving top rankings to class:', error);
    throw error;
  }
};

// FIXED: Save complete results with correct quiz ID
const saveCompleteQuizResults = async (quiz) => {
  try {
    const allResults = await getAllQuizResultsForAdmin(quiz.id);
    
    const completeResultsData = {
      quizId: quiz.id, // Use correct quiz ID
      quizName: quiz.name,
      quizClass: quiz.class,
      allResults: allResults,
      totalParticipants: allResults.length,
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      sessionId: `${quiz.id}_${Date.now()}_complete`
    };

    await addDoc(collection(db, COMPLETE_RESULTS_COLLECTION), completeResultsData);
    console.log('📊 Complete results saved for quiz:', quiz.name, 'ID:', quiz.id);
    return allResults;
  } catch (error) {
    console.error('Error saving complete quiz results:', error);
    throw error;
  }
};
// ==================== TIME SYNCHRONIZATION ====================

// ==================== TIME SYNCHRONIZATION ====================

// FIXED: Get current server time from Firebase - RELIABLE VERSION
// ULTRA-RELIABLE: Get current server time from Firebase
export const getServerTime = async () => {
  try {
    // Method 1: Use a completely new approach with transaction-like behavior
    const tempCollection = 'timeSyncTemp';
    const tempDocId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempRef = doc(db, tempCollection, tempDocId);
    
    // Write with server timestamp
    const writeResult = await setDoc(tempRef, {
      createdAt: serverTimestamp(),
      clientTime: Date.now(),
      randomId: Math.random().toString(36).substr(2, 9)
    });
    
    // Add a small delay to ensure server processes the write
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Read it back multiple times if needed
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      const docSnap = await getDoc(tempRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if server timestamp is properly set
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          const serverTime = data.createdAt.toDate().getTime();
          
          console.log('✅ Server time successfully retrieved:', {
            serverTime: new Date(serverTime).toISOString(),
            clientTime: new Date(data.clientTime).toISOString(),
            difference: serverTime - data.clientTime,
            attempt: attempts + 1
          });
          
          // Clean up
          await deleteDoc(tempRef).catch(e => console.log('Cleanup warning:', e.message));
          return serverTime;
        } else {
          console.log('🕒 Waiting for server timestamp... attempt:', attempts + 1);
        }
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Fallback after all attempts
    console.warn('⚠️ Using client time as fallback after', maxAttempts, 'attempts');
    await deleteDoc(tempRef).catch(e => console.log('Cleanup warning:', e.message));
    return Date.now();
    
  } catch (error) {
    console.error('❌ Error in getServerTime:', error.message);
    return Date.now(); // Fallback to client time
  }
};

// FIXED: Calculate time offset between server and client
export const calculateTimeOffset = async () => {
  try {
    // Try multiple times to get accurate server time
    let serverTime;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      serverTime = await getServerTime();
      attempts++;
      
      // If we got a valid server time, break
      if (serverTime && serverTime > 0) {
        break;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const clientTime = Date.now();
    const offset = serverTime - clientTime;
    
    console.log('⏰ Time synchronization completed:', {
      serverTime: new Date(serverTime).toISOString(),
      clientTime: new Date(clientTime).toISOString(), 
      offset: `${offset}ms`,
      offsetSeconds: `${(offset / 1000).toFixed(1)}s`,
      attempts: attempts
    });
    
    return offset;
  } catch (error) {
    console.error('Error calculating time offset:', error);
    return 0; // No offset if failed
  }
};

// Get synchronized time (client time + offset)
export const getSynchronizedTime = (offset = 0) => {
  return Date.now() + offset;
};

// Update quiz start to use server time
export const startQuizWithServerTime = async () => {
  try {
    // Add a 3-second buffer for students to sync
    const bufferTime = 3000; // 3 seconds
    const serverTime = await getServerTime();
    const quizStartTime = serverTime + bufferTime;
    
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
    await updateDoc(activeQuizRef, {
      status: 'active',
      quizStartTime: quizStartTime, // Start 3 seconds in future
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Quiz starting in 3 seconds at:', new Date(quizStartTime).toISOString());
    return quizStartTime;
  } catch (error) {
    console.error('Error starting quiz with server time:', error);
    throw error;
  }
};

// NEW: Enhanced time sync with better error handling
export const initializeTimeSync = async () => {
  try {
    console.log('🕒 Starting time synchronization...');
    
    const offset = await calculateTimeOffset();
    
    // Store offset globally for use in getSyncTime
    if (typeof window !== 'undefined') {
      window.timeOffset = offset;
    }
    
    console.log('✅ Time synchronization ready. Offset:', offset, 'ms');
    return offset;
  } catch (error) {
    console.error('❌ Time synchronization failed:', error);
    return 0;
  }
};

// NEW: Check if time is synchronized
export const isTimeSynced = () => {
  return typeof window !== 'undefined' && window.timeOffset !== undefined;
};

// NEW: Get sync time with fallback
export const getSyncTime = () => {
  const offset = (typeof window !== 'undefined' && window.timeOffset) || 0;
  return Date.now() + offset;
};
export const removeQuizPasskey = async (quizId) => {
  try {
    const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
    await updateDoc(quizRef, {
      passkey: '',
      updatedAt: serverTimestamp()
    });
    
    // Also remove from active quiz if it exists
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const activeQuiz = activeQuizDoc.data();
      if (activeQuiz.originalQuizId === quizId || activeQuiz.id === quizId) {
        await updateDoc(activeQuizRef, {
          passkey: '',
          lastUpdated: serverTimestamp()
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing quiz passkey:', error);
    throw error;
  }
};
export const updateQuizPasskey = async (quizId, newPasskey) => {
  try {
    const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
    await updateDoc(quizRef, {
      passkey: newPasskey,
      updatedAt: serverTimestamp()
    });
    
    // Also update active quiz if it exists
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    const activeQuizDoc = await getDoc(activeQuizRef);
    
    if (activeQuizDoc.exists()) {
      const activeQuiz = activeQuizDoc.data();
      if (activeQuiz.originalQuizId === quizId || activeQuiz.id === quizId) {
        await updateDoc(activeQuizRef, {
          passkey: newPasskey,
          lastUpdated: serverTimestamp()
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating quiz passkey:', error);
    throw error;
  }
};
// NEW: Check if student name already exists in waiting room or results
export const checkDuplicateStudentName = async (quizId, studentName) => {
  try {
    // Check in waiting room (active quiz)
    const activeQuiz = await getActiveQuizFromFirestore();
    if (activeQuiz && activeQuiz.waitingParticipants) {
      const inWaitingRoom = activeQuiz.waitingParticipants.includes(studentName);
      if (inWaitingRoom) {
        return { 
          exists: true, 
          location: 'waiting_room', 
          message: 'This name is already in the waiting room' 
        };
      }
    }

    // Check in completed results
    const existingResult = await getStudentResult(quizId, studentName);
    if (existingResult) {
      return { 
        exists: true, 
        location: 'completed_quiz', 
        message: 'This name has already completed the quiz' 
      };
    }

    return { exists: false, location: null, message: 'Name is available' };
  } catch (error) {
    console.error('Error checking duplicate name:', error);
    return { exists: false, location: null, message: 'Error checking name' };
  }
};
// ==================== PROGRESS PERSISTENCE ====================
export const saveQuizProgress = async (quizId, studentName, progress) => {
  try {
    const progressData = {
      ...progress,
      quizId,
      studentName,
      lastSaved: serverTimestamp(),
      answers: progress.answers || []
    };

    // Save to Firebase
    const progressRef = doc(db, 'quizProgress', `${quizId}_${studentName}`);
    await setDoc(progressRef, progressData);
    
    // Also save to localStorage as backup
    localStorage.setItem(`quizProgress_${quizId}_${studentName}`, JSON.stringify(progressData));
    
    console.log('💾 Progress saved:', { quizId, studentName, question: progress.currentQuestionIndex });
  } catch (error) {
    console.error('Error saving progress:', error);
    // Fallback to localStorage only
    const fallbackData = {  // FIXED: Use fallbackData instead of progressData
      ...progress,
      quizId,
      studentName,
      lastSaved: Date.now(),
      answers: progress.answers || []
    };
    localStorage.setItem(`quizProgress_${quizId}_${studentName}`, JSON.stringify(fallbackData));  // FIXED: Use fallbackData
  }
};

export const getQuizProgress = async (quizId, studentName) => {
  try {
    // Try Firebase first
    const progressRef = doc(db, 'quizProgress', `${quizId}_${studentName}`);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists()) {
      const data = progressDoc.data();
      console.log('📥 Progress loaded from Firebase:', data);
      return data;
    }
    
    // Fallback to localStorage
    const localProgress = localStorage.getItem(`quizProgress_${quizId}_${studentName}`);
    if (localProgress) {
      const data = JSON.parse(localProgress);
      console.log('📥 Progress loaded from localStorage:', data);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading progress:', error);
    // Fallback to localStorage
    const localProgress = localStorage.getItem(`quizProgress_${quizId}_${studentName}`);
    return localProgress ? JSON.parse(localProgress) : null;
  }
};

export const clearQuizProgress = async (quizId, studentName) => {
  try {
    // Clear from Firebase
    const progressRef = doc(db, 'quizProgress', `${quizId}_${studentName}`);
    await deleteDoc(progressRef);
  } catch (error) {
    console.error('Error clearing progress from Firebase:', error);
  }
  
  // Clear from localStorage
  localStorage.removeItem(`quizProgress_${quizId}_${studentName}`);
  console.log('🧹 Progress cleared for:', studentName);
};