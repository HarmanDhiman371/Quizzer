// import { 
//   collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc,
//   onSnapshot, query, where, orderBy, serverTimestamp, setDoc, limit
// } from 'firebase/firestore';
// import { db } from '../firebase/config';

// const QUIZZES_COLLECTION = 'quizzes';
// const ACTIVE_QUIZ_COLLECTION = 'activeQuiz';
// const RESULTS_COLLECTION = 'results';
// const CLASS_RESULTS_COLLECTION = 'classResults';
// // Initialize active quiz document
// export const initializeActiveQuiz = async () => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const docSnap = await getDoc(activeQuizRef);
    
//     if (!docSnap.exists()) {
//       await setDoc(activeQuizRef, {
//         status: 'inactive',
//         lastUpdated: serverTimestamp()
//       });
//       console.log('✅ Active quiz document initialized');
//     }
//   } catch (error) {
//     console.error('Error initializing active quiz:', error);
//   }
// };

// // Quiz Operations
// export const saveQuizToFirestore = async (quiz) => {
//   try {
//     const quizWithTimestamp = {
//       ...quiz,
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//       status: 'scheduled',
//       currentQuestionIndex: 0
//     };
    
//     const { id, ...quizData } = quizWithTimestamp;
//     const docRef = await addDoc(collection(db, QUIZZES_COLLECTION), quizData);
//     return { id: docRef.id, ...quizData };
//   } catch (error) {
//     console.error('Error saving quiz:', error);
//     throw error;
//   }
// };

// export const getScheduledQuizById = async (quizId) => {
//   try {
//     const quizDoc = await getDoc(doc(db, QUIZZES_COLLECTION, quizId));
//     if (quizDoc.exists()) {
//       return { id: quizDoc.id, ...quizDoc.data() };
//     }
//     return null;
//   } catch (error) {
//     console.error('Error getting scheduled quiz:', error);
//     return null;
//   }
// };

// export const activateScheduledQuiz = async (quizId) => {
//   try {
//     const quiz = await getScheduledQuizById(quizId);
//     if (!quiz) {
//       throw new Error('Quiz not found');
//     }

//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
//     const activeQuizData = {
//       ...quiz,
//       originalQuizId: quiz.id,
//       quizStartTime: null,
//       currentQuestionIndex: 0,
//       totalParticipants: 0,
//       waitingParticipants: [],
//       status: 'waiting',
//       lastUpdated: serverTimestamp(),
//       isFromScheduled: true
//     };

//     console.log('🚀 Moving scheduled quiz to waiting room:', quiz.name);
    
//     await setDoc(activeQuizRef, activeQuizData);
    
//     await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
//       status: 'activated',
//       activatedAt: serverTimestamp()
//     });
    
//     console.log('✅ Scheduled quiz moved to waiting room');
//     return activeQuizData;
//   } catch (error) {
//     console.error('Error activating scheduled quiz:', error);
//     throw error;
//   }
// };

// export const isStudentInWaitingRoom = async (studentName) => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const activeQuizDoc = await getDoc(activeQuizRef);
    
//     if (activeQuizDoc.exists()) {
//       const activeQuiz = activeQuizDoc.data();
//       const waitingParticipants = activeQuiz.waitingParticipants || [];
//       return waitingParticipants.includes(studentName);
//     }
//     return false;
//   } catch (error) {
//     console.error('Error checking waiting room status:', error);
//     return false;
//   }
// };

// export const joinScheduledQuizWaitingRoom = async (quizId, studentName) => {
//   try {
//     console.log('🚀 Joining scheduled quiz:', quizId, studentName);
    
//     const quiz = await getScheduledQuizById(quizId);
//     if (!quiz) {
//       throw new Error('Quiz not found');
//     }

//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const activeQuizDoc = await getDoc(activeQuizRef);
    
//     let activeQuiz;
    
//     if (!activeQuizDoc.exists() || activeQuizDoc.data().status === 'inactive') {
//       if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
//         throw new Error('Quiz has no valid questions');
//       }
      
//       activeQuiz = {
//         ...quiz,
//         originalQuizId: quiz.id,
//         quizStartTime: null,
//         currentQuestionIndex: 0,
//         totalParticipants: 1,
//         waitingParticipants: [studentName],
//         status: 'waiting',
//         lastUpdated: serverTimestamp(),
//         isFromScheduled: true
//       };

//       await setDoc(activeQuizRef, activeQuiz);
      
//       await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
//         status: 'activated',
//         activatedAt: serverTimestamp()
//       });
      
//     } else {
//       const currentData = activeQuizDoc.data();
      
//       if (currentData.status === 'active') {
//         throw new Error('Quiz has already started. Cannot join now.');
//       }
      
//       const currentParticipants = currentData.waitingParticipants || [];
      
//       if (!currentParticipants.includes(studentName)) {
//         const updatedParticipants = [...currentParticipants, studentName];
//         await updateDoc(activeQuizRef, {
//           waitingParticipants: updatedParticipants,
//           totalParticipants: (currentData.totalParticipants || 0) + 1,
//           lastUpdated: serverTimestamp()
//         });
//       }
      
//       activeQuiz = { id: activeQuizDoc.id, ...currentData };
//     }

//     console.log('✅ Successfully joined waiting room');
//     return { success: true, quiz: activeQuiz };
    
//   } catch (error) {
//     console.error('❌ Error joining scheduled quiz waiting room:', error);
//     throw error;
//   }
// };

// export const deleteQuizFromFirestore = async (quizId) => {
//   try {
//     await deleteDoc(doc(db, QUIZZES_COLLECTION, quizId));
//     console.log('✅ Quiz deleted:', quizId);
//   } catch (error) {
//     console.error('Error deleting quiz:', error);
//     throw error;
//   }
// };

// export const setActiveQuiz = async (quiz) => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
//     const activeQuizData = {
//       ...quiz,
//       originalQuizId: quiz.id,
//       quizStartTime: null,
//       currentQuestionIndex: 0,
//       totalParticipants: 0,
//       waitingParticipants: quiz.waitingParticipants || [],
//       status: 'waiting',
//       lastUpdated: serverTimestamp(),
//       isFromScheduled: quiz.isFromScheduled || false
//     };

//     console.log('🚀 Setting active quiz to waiting room:', quiz.name);
    
//     await setDoc(activeQuizRef, activeQuizData);
//     console.log('✅ Active quiz set to waiting room:', quiz.name);
//     return activeQuizData;
//   } catch (error) {
//     console.error('Error setting active quiz:', error);
//     throw error;
//   }
// };

// export const getActiveQuizFromFirestore = async () => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const docSnap = await getDoc(activeQuizRef);
    
//     if (docSnap.exists()) {
//       const data = docSnap.data();
//       return { id: docSnap.id, ...data };
//     }
//     return null;
//   } catch (error) {
//     console.error('Error getting active quiz:', error);
//     return null;
//   }
// };

// // FIXED: Real-time listener for active quiz
// export const listenToActiveQuiz = (callback) => {
//   const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
  
//   return onSnapshot(activeQuizRef, (docSnap) => {
//     if (docSnap.exists()) {
//       const quizData = { id: docSnap.id, ...docSnap.data() };
//       console.log('🎯 REAL-TIME UPDATE - Quiz Status:', quizData.status);
//       callback(quizData);
//     } else {
//       console.log('🎯 REAL-TIME UPDATE - No active quiz');
//       callback(null);
//     }
//   });
// };

// export const updateCurrentQuestion = async (newIndex) => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     await updateDoc(activeQuizRef, {
//       currentQuestionIndex: newIndex,
//       lastUpdated: serverTimestamp()
//     });
//   } catch (error) {
//     console.error('Error updating current question:', error);
//     throw error;
//   }
// };

// // FIXED: Save top rankings to class results
// // FIXED: Save top rankings to class results
// export const saveTopRankingsToClass = async (quiz) => {
//   try {
//     // Get current quiz results only (use simple query)
//     const resultsQuery = query(
//       collection(db, RESULTS_COLLECTION),
//       where('quizId', '==', quiz.id),
//       orderBy('score', 'desc'),
//       limit(5)
//     );
    
//     const resultsSnapshot = await getDocs(resultsQuery);
//     const topRankings = [];
    
//     resultsSnapshot.forEach(doc => {
//       const data = doc.data();
//       topRankings.push({
//         studentName: data.studentName,
//         score: data.score,
//         percentage: data.percentage,
//         totalQuestions: data.totalQuestions,
//         tabSwitches: data.tabSwitches || 0
//       });
//     });

//     // Manual sorting for tie-breaker
//     topRankings.sort((a, b) => {
//       if (b.score !== a.score) return b.score - a.score;
//       return (a.completedAt || 0) - (b.completedAt || 0);
//     });

//     // Save to class results
//     const classResultData = {
//       quizId: quiz.id,
//       quizName: quiz.name,
//       quizClass: quiz.class,
//       topRankings: topRankings,
//       totalParticipants: topRankings.length,
//       completedAt: serverTimestamp(),
//       createdAt: serverTimestamp(),
//       sessionId: `${quiz.id}_${Date.now()}`
//     };

//     await addDoc(collection(db, CLASS_RESULTS_COLLECTION), classResultData);
//     console.log('🏆 Top 5 rankings saved to class results:', quiz.name);
//     return topRankings;
//   } catch (error) {
//     console.error('Error saving top rankings to class:', error);
//     throw error;
//   }
// };

// // FIXED: Enhanced end active quiz function
// export const endActiveQuiz = async () => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const activeQuizDoc = await getDoc(activeQuizRef);
    
//     if (activeQuizDoc.exists()) {
//       const activeQuiz = { id: activeQuizDoc.id, ...activeQuizDoc.data() };
      
//       console.log('🎯 Ending quiz:', activeQuiz.name);
      
//       // FIXED: Save top rankings AND ensure data integrity
//       if (activeQuiz.id && activeQuiz.name) {
//         await saveTopRankingsToClass(activeQuiz);
        
//         // Also save complete results for admin
//         await saveCompleteQuizResults(activeQuiz);
        
//         if (activeQuiz.originalQuizId) {
//           const originalQuizRef = doc(db, QUIZZES_COLLECTION, activeQuiz.originalQuizId);
//           await updateDoc(originalQuizRef, {
//             status: 'completed',
//             endedAt: serverTimestamp()
//           });
//         }
//       }
      
//       // Clear active quiz
//       await setDoc(activeQuizRef, {
//         status: 'inactive',
//         lastUpdated: serverTimestamp()
//       });
      
//       console.log('✅ Quiz ended, rankings saved, and complete results stored');
//     }
//   } catch (error) {
//     console.error('Error ending quiz:', error);
//     throw error;
//   }
// };

// // In the pauseQuiz function, remove the unused 'currentData' variable
// export const pauseQuiz = async () => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const activeQuizDoc = await getDoc(activeQuizRef);
    
//     if (activeQuizDoc.exists()) {
//       // Remove the unused variable assignment
//       await updateDoc(activeQuizRef, {
//         status: 'paused',
//         pauseStartTime: Date.now(),
//         lastUpdated: serverTimestamp()
//       });
//       console.log('⏸️ Quiz paused');
//     }
//   } catch (error) {
//     console.error('Error pausing quiz:', error);
//     throw error;
//   }
// };

// export const resumeQuiz = async () => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const activeQuizDoc = await getDoc(activeQuizRef);
    
//     if (activeQuizDoc.exists()) {
//       const currentData = activeQuizDoc.data();
//       const pauseDuration = Date.now() - (currentData.pauseStartTime || Date.now());
//       const newQuizStartTime = currentData.quizStartTime + pauseDuration;
      
//       await updateDoc(activeQuizRef, {
//         status: 'active',
//         quizStartTime: newQuizStartTime,
//         lastUpdated: serverTimestamp()
//       });
//       console.log('▶️ Quiz resumed');
//     }
//   } catch (error) {
//     console.error('Error resuming quiz:', error);
//     throw error;
//   }
// };

// export const startQuizFromWaitingRoom = async () => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const activeQuizDoc = await getDoc(activeQuizRef);
    
//     if (activeQuizDoc.exists()) {
//       const currentData = activeQuizDoc.data();
      
//       await updateDoc(activeQuizRef, {
//         status: 'active',
//         quizStartTime: Date.now(),
//         lastUpdated: serverTimestamp()
//       });
      
//       console.log('🚀 Quiz started from waiting room');
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('Error starting quiz from waiting room:', error);
//     throw error;
//   }
// };

// export const addStudentToWaitingRoom = async (studentName) => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const activeQuizDoc = await getDoc(activeQuizRef);
    
//     if (!activeQuizDoc.exists()) {
//       return [];
//     }

//     const currentData = activeQuizDoc.data();
//     const currentParticipants = currentData.waitingParticipants || [];
    
//     if (currentParticipants.includes(studentName)) {
//       return currentParticipants;
//     }

//     const updatedParticipants = [...currentParticipants, studentName];
    
//     await updateDoc(activeQuizRef, {
//       waitingParticipants: updatedParticipants,
//       lastUpdated: serverTimestamp()
//     });
    
//     console.log('✅ Student added to waiting room:', studentName);
//     return updatedParticipants;
    
//   } catch (error) {
//     console.error('Error adding student to waiting room:', error);
//     throw error;
//   }
// };

// // FIXED: Get student result with proper filtering
// export const getStudentResult = async (quizId, studentName) => {
//   try {
//     const q = query(
//       collection(db, RESULTS_COLLECTION), 
//       where('quizId', '==', quizId),
//       where('studentName', '==', studentName)
//     );
    
//     const querySnapshot = await getDocs(q);
//     if (!querySnapshot.empty) {
//       const doc = querySnapshot.docs[0];
//       const data = doc.data();
//       return { 
//         id: doc.id, 
//         ...data,
//         score: Number(data.score) || 0,
//         percentage: Number(data.percentage) || 0,
//         tabSwitches: Number(data.tabSwitches) || 0
//       };
//     }
//     return null;
//   } catch (error) {
//     console.error('Error getting student result:', error);
//     return null;
//   }
// };

// const cleanAnswersArray = (answers) => {
//   if (!answers) return [];
//   return answers.map(answer => answer === undefined ? '' : answer);
// };

// // FIXED: Save or update quiz result with better duplicate prevention
// export const saveOrUpdateQuizResult = async (result) => {
//   try {
//     const cleanedResult = {
//       ...result,
//       answers: result.answers || [],
//       tabSwitches: result.tabSwitches || 0,
//       totalQuestions: result.totalQuestions || 1,
//       quizId: result.quizId,
//       quizName: result.quizName,
//       quizClass: result.quizClass || 'Unknown'
//     };

//     const existingResult = await getStudentResult(cleanedResult.quizId, cleanedResult.studentName);
    
//     if (existingResult) {
//       // Update existing result
//       const resultRef = doc(db, RESULTS_COLLECTION, existingResult.id);
//       await updateDoc(resultRef, {
//         score: cleanedResult.score,
//         percentage: cleanedResult.percentage,
//         totalQuestions: cleanedResult.totalQuestions,
//         answers: cleanedResult.answers,
//         tabSwitches: cleanedResult.tabSwitches,
//         completedAt: cleanedResult.completedAt || existingResult.completedAt
//       });
//       return { id: existingResult.id, ...cleanedResult };
//     } else {
//       // Create new result
//       const resultWithTimestamp = {
//         ...cleanedResult,
//         submittedAt: serverTimestamp(),
//         joinTime: cleanedResult.joinTime || Date.now()
//       };
      
//       const docRef = await addDoc(collection(db, RESULTS_COLLECTION), resultWithTimestamp);
//       return { id: docRef.id, ...cleanedResult };
//     }
//   } catch (error) {
//     console.error('Error saving/updating result:', error);
//     throw error;
//   }
// };
// export const incrementParticipantCount = async () => {
//   try {
//     const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
//     const activeQuizDoc = await getDoc(activeQuizRef);
    
//     if (activeQuizDoc.exists()) {
//       const currentData = activeQuizDoc.data();
//       await updateDoc(activeQuizRef, {
//         totalParticipants: (currentData.totalParticipants || 0) + 1,
//         lastUpdated: serverTimestamp()
//       });
//     }
//   } catch (error) {
//     console.error('Error incrementing participant count:', error);
//   }
// };

// // FIXED: Get quiz results with proper filtering and sorting
// // FIXED: Get quiz results with proper filtering and sorting
// export const getQuizResultsFromFirestore = async (quizId) => {
//   try {
//     console.log('🔍 Fetching results for quiz:', quizId);
    
//     const q = query(
//       collection(db, RESULTS_COLLECTION), 
//       where('quizId', '==', quizId)
//     );
    
//     const querySnapshot = await getDocs(q);
//     const results = [];
//     const seenStudents = new Set();
    
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       const studentKey = data.studentName;
      
//       // FIXED: Only take latest result per student for THIS quiz
//       if (!seenStudents.has(studentKey)) {
//         seenStudents.add(studentKey);
        
//         const totalQuestions = data.totalQuestions || (data.answers ? data.answers.length : 0) || 1;
//         const score = Number(data.score) || 0;
//         const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        
//         results.push({ 
//           id: doc.id, 
//           ...data,
//           score: score,
//           totalQuestions: totalQuestions,
//           percentage: percentage,
//           tabSwitches: Number(data.tabSwitches) || 0
//         });
//       }
//     });
    
//     // FIXED: Manual sorting for tie-breaker
//     results.sort((a, b) => {
//       if (b.score !== a.score) return b.score - a.score;
//       return (a.completedAt || 0) - (b.completedAt || 0);
//     });
    
//     console.log(`📊 Found ${results.length} unique results for quiz: ${quizId}`);
//     return results;
//   } catch (error) {
//     console.error('Error getting quiz results:', error);
//     throw error;
//   }
// };
// // FIXED: Real-time listener for quiz results with duplicate prevention
// export const listenToQuizResults = (quizId, callback) => {
//   const q = query(
//     collection(db, RESULTS_COLLECTION), 
//     where('quizId', '==', quizId),
//     orderBy('score', 'desc')
//   );
  
//   return onSnapshot(q, (querySnapshot) => {
//     const results = [];
//     const seenStudents = new Set();
    
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       const studentKey = `${data.studentName}_${quizId}`;
      
//       // Take only the latest result per student
//       if (!seenStudents.has(studentKey)) {
//         seenStudents.add(studentKey);
//         results.push({ 
//           id: doc.id, 
//           ...data,
//           score: Number(data.score) || 0,
//           percentage: Number(data.percentage) || 0,
//           tabSwitches: Number(data.tabSwitches) || 0
//         });
//       }
//     });
    
//     console.log(`📊 Real-time: ${results.length} unique participants for quiz: ${quizId}`);
//     callback(results);
//   });
// };

// export const getQuizzesFromFirestore = async () => {
//   try {
//     const q = query(
//       collection(db, QUIZZES_COLLECTION),
//       where('status', 'in', ['scheduled', 'draft']),
//       orderBy('scheduledTime', 'asc')
//     );
    
//     const querySnapshot = await getDocs(q);
//     const quizzes = [];
//     querySnapshot.forEach((doc) => {
//       quizzes.push({ id: doc.id, ...doc.data() });
//     });
//     return quizzes;
//   } catch (error) {
//     console.error('Error getting quizzes:', error);
//     throw error;
//   }
// };

// export const getClassResults = async () => {
//   try {
//     const q = query(
//       collection(db, CLASS_RESULTS_COLLECTION),
//       orderBy('completedAt', 'desc')
//     );
    
//     const querySnapshot = await getDocs(q);
//     const classResults = [];
//     querySnapshot.forEach((doc) => {
//       classResults.push({ id: doc.id, ...doc.data() });
//     });
//     return classResults;
//   } catch (error) {
//     console.error('Error getting class results:', error);
//     throw error;
//   }
// };

// export const getAllScheduledQuizzes = async () => {
//   try {
//     const q = query(
//       collection(db, QUIZZES_COLLECTION),
//       where('status', 'in', ['scheduled', 'activated']),
//       orderBy('scheduledTime', 'asc')
//     );
    
//     const querySnapshot = await getDocs(q);
//     const quizzes = [];
    
//     querySnapshot.forEach((doc) => {
//       quizzes.push({ 
//         id: doc.id, 
//         ...doc.data()
//       });
//     });
    
//     console.log(`📅 Found ${quizzes.length} scheduled/activated quizzes`);
//     return quizzes;
//   } catch (error) {
//     console.error('Error getting all scheduled quizzes:', error);
//     return [];
//   }
// };
// export const getAllQuizResultsForAdmin = async (quizId) => {
//   try {
//     console.log('👑 Admin fetching ALL results for quiz:', quizId);
    
//     const q = query(
//       collection(db, RESULTS_COLLECTION), 
//       where('quizId', '==', quizId)
//     );
    
//     const querySnapshot = await getDocs(q);
//     const results = [];
    
//     const seenStudents = new Set();
    
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       const studentKey = `${data.studentName}_${quizId}`;
      
//       // Take only the latest result per student
//       if (!seenStudents.has(studentKey)) {
//         seenStudents.add(studentKey);
        
//         const totalQuestions = data.totalQuestions || 
//                               (data.answers ? data.answers.length : 0) || 
//                               1;
//         const score = Number(data.score) || 0;
//         const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        
//         results.push({ 
//           id: doc.id, 
//           ...data,
//           score: score,
//           totalQuestions: totalQuestions,
//           percentage: percentage,
//           tabSwitches: Number(data.tabSwitches) || 0
//         });
//       }
//     });
    
//     // Sort by score descending
//     results.sort((a, b) => {
//       if (b.score !== a.score) return b.score - a.score;
//       return (a.completedAt || 0) - (b.completedAt || 0);
//     });
    
//     console.log(`👑 Admin found ${results.length} total participants for quiz: ${quizId}`);
//     return results;
//   } catch (error) {
//     console.error('Error getting all results for admin:', error);
//     throw error;
//   }
// };
// // FIXED: Get all class results with proper filtering
// export const getAllClassResults = async () => {
//   try {
//     const q = query(
//       collection(db, CLASS_RESULTS_COLLECTION),
//       orderBy('completedAt', 'desc'),
//       limit(50) // Limit to prevent loading too much data
//     );
    
//     const querySnapshot = await getDocs(q);
//     const classResults = [];
//     const seenQuizzes = new Set();
    
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       const quizKey = data.quizId;
      
//       // Take only the latest result per quiz
//       if (!seenQuizzes.has(quizKey)) {
//         seenQuizzes.add(quizKey);
//         classResults.push({ id: doc.id, ...data });
//       }
//     });
    
//     console.log(`🏆 Found ${classResults.length} unique class results`);
//     return classResults;
//   } catch (error) {
//     console.error('Error getting class results:', error);
//     throw error;
//   }
// };

// export const getScheduledQuizzes = async () => {
//   try {
//     const q = query(
//       collection(db, QUIZZES_COLLECTION),
//       where('status', 'in', ['scheduled', 'activated']),
//       orderBy('scheduledTime', 'asc')
//     );
    
//     const querySnapshot = await getDocs(q);
//     const quizzes = [];
    
//     querySnapshot.forEach((doc) => {
//       quizzes.push({ 
//         id: doc.id, 
//         ...doc.data()
//       });
//     });
    
//     console.log(`📅 Found ${quizzes.length} scheduled/activated quizzes`);
//     return quizzes;
//   } catch (error) {
//     console.error('Error getting scheduled quizzes:', error);
//     return [];
//   }
// };

// export const deleteClassResult = async (resultId) => {
//   try {
//     await deleteDoc(doc(db, CLASS_RESULTS_COLLECTION, resultId));
//     console.log('🗑️ Class result deleted:', resultId);
//     return true;
//   } catch (error) {
//     console.error('Error deleting class result:', error);
//     throw error;
//   }
// };

// export const saveQuizResults = async (quizId, studentId, resultData) => {
//   try {
//     const studentResultRef = doc(db, 'students', studentId, 'results', quizId);
//     await setDoc(studentResultRef, resultData);

//     const classResultRef = doc(db, 'quizzes', quizId, 'results', studentId);
//     await setDoc(classResultRef, resultData);

//     console.log('✅ Results saved successfully');
//     return true;
//   } catch (error) {
//     console.error('❌ Error saving results:', error);
//     throw error;
//   }
// };

// export const calculateRankings = async (quizId, studentId, score, timestamp) => {
//   try {
//     const resultsSnapshot = await getDocs(collection(db, 'quizzes', quizId, 'results'));
//     const allResults = [];
    
//     resultsSnapshot.forEach(doc => {
//       const data = doc.data();
//       allResults.push({
//         studentId: data.studentId,
//         score: data.score,
//         timestamp: data.timestamp
//       });
//     });

//     const sortedResults = allResults.sort((a, b) => {
//       if (b.score !== a.score) return b.score - a.score;
//       return a.timestamp - b.timestamp;
//     });

//     const rank = sortedResults.findIndex(result => result.studentId === studentId) + 1;
//     const totalParticipants = sortedResults.length;

//     return { rank, totalParticipants };
//   } catch (error) {
//     console.error('❌ Error calculating rankings:', error);
//     throw error;
//   }
// };

// // FIXED: Update tab switch count with proper data
// export const updateTabSwitchCount = async (quizId, studentName, switchCount) => {
//   try {
//     const existingResult = await getStudentResult(quizId, studentName);
    
//     if (existingResult) {
//       const resultRef = doc(db, RESULTS_COLLECTION, existingResult.id);
//       await updateDoc(resultRef, {
//         tabSwitches: switchCount,
//         lastActivity: serverTimestamp()
//       });
//       console.log('🔄 Updated tab switch count for:', studentName, switchCount);
//     }
//   } catch (error) {
//     console.error('Error updating tab switch count:', error);
//   }
// };
// export const saveCompleteQuizResults = async (quiz) => {
//   try {
//     const allResults = await getAllQuizResultsForAdmin(quiz.id);
    
//     // Save complete results to a separate collection for admin
//     const completeResultsData = {
//       quizId: quiz.id,
//       quizName: quiz.name,
//       quizClass: quiz.class,
//       allResults: allResults,
//       totalParticipants: allResults.length,
//       completedAt: serverTimestamp(),
//       createdAt: serverTimestamp(),
//       sessionId: `${quiz.id}_${Date.now()}_complete`
//     };

//     await addDoc(collection(db, 'completeQuizResults'), completeResultsData);
//     console.log('📊 Complete quiz results saved for admin:', quiz.name);
//     return allResults;
//   } catch (error) {
//     console.error('Error saving complete quiz results:', error);
//     throw error;
//   }
// };
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
        originalQuizId: quiz.id, // PRESERVE ORIGINAL ID
        quizStartTime: null,
        currentQuestionIndex: 0,
        totalParticipants: 1,
        waitingParticipants: [studentName],
        status: 'waiting',
        lastUpdated: serverTimestamp(),
        isFromScheduled: true
      };

      await setDoc(activeQuizRef, activeQuiz);
      
      await updateDoc(doc(db, QUIZZES_COLLECTION, quizId), {
        status: 'activated',
        activatedAt: serverTimestamp()
      });
      
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
      return { id: docSnap.id, ...data };
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
      const quizData = { id: docSnap.id, ...docSnap.data() };
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

// FIXED: Get scheduled quizzes excluding completed ones
export const getAllScheduledQuizzes = async () => {
  try {
    const q = query(
      collection(db, QUIZZES_COLLECTION),
      where('status', 'in', ['scheduled', 'activated']), // Only get scheduled and activated
      orderBy('scheduledTime', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    
    querySnapshot.forEach((doc) => {
      const quizData = doc.data();
      // FIX: Only include quizzes that are not completed
      if (quizData.status !== 'completed') {
        quizzes.push({ 
          id: doc.id, 
          ...quizData
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
    const existingResult = await getStudentResult(quizId, studentName);
    
    if (existingResult) {
      const resultRef = doc(db, RESULTS_COLLECTION, existingResult.id);
      await updateDoc(resultRef, {
        tabSwitches: switchCount,
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastTabUpdate: Date.now()
      });
    }
  } catch (error) {
    console.error('Error updating tab switch count:', error);
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

// NEW: Get current server time from Firebase
export const getServerTime = async () => {
  try {
    const serverTimeRef = doc(db, 'serverTime', 'current');
    await setDoc(serverTimeRef, {
      timestamp: serverTimestamp()
    });
    
    const docSnap = await getDoc(serverTimeRef);
    if (docSnap.exists()) {
      const serverTime = docSnap.data().timestamp;
      return serverTime.toDate().getTime(); // Convert to milliseconds
    }
    return Date.now(); // Fallback to client time
  } catch (error) {
    console.error('Error getting server time:', error);
    return Date.now(); // Fallback to client time
  }
};

// NEW: Calculate time offset between server and client
export const calculateTimeOffset = async () => {
  try {
    const serverTime = await getServerTime();
    const clientTime = Date.now();
    const offset = serverTime - clientTime;
    
    console.log('⏰ Time synchronization:', {
      serverTime: new Date(serverTime).toISOString(),
      clientTime: new Date(clientTime).toISOString(), 
      offset: `${offset}ms`,
      offsetSeconds: `${(offset / 1000).toFixed(1)}s`
    });
    
    return offset;
  } catch (error) {
    console.error('Error calculating time offset:', error);
    return 0; // No offset if failed
  }
};

// NEW: Get synchronized time (client time + offset)
export const getSynchronizedTime = (offset = 0) => {
  return Date.now() + offset;
};

// NEW: Update quiz start to use server time
export const startQuizWithServerTime = async () => {
  try {
    const serverTime = await getServerTime();
    const activeQuizRef = doc(db, ACTIVE_QUIZ_COLLECTION, 'current');
    
    await updateDoc(activeQuizRef, {
      status: 'active',
      quizStartTime: serverTime, // Use server time instead of Date.now()
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Quiz started with server time:', new Date(serverTime).toISOString());
    return serverTime;
  } catch (error) {
    console.error('Error starting quiz with server time:', error);
    throw error;
  }
};