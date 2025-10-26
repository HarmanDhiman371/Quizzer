// import { 
//   collection, 
//   addDoc, 
//   updateDoc, 
//   deleteDoc, 
//   doc, 
//   getDocs, 
//   getDoc,
//   onSnapshot,
//   query,
//   where,
//   orderBy,
//   serverTimestamp 
// } from 'firebase/firestore';
// import { db } from '../firebase/config';

// // Collection names
// const QUIZZES_COLLECTION = 'quizzes';
// const RESULTS_COLLECTION = 'results';

// // Quiz Operations
// export const saveQuizToFirestore = async (quiz) => {
//   try {
//     const quizWithTimestamp = {
//       ...quiz,
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp()
//     };
    
//     // Remove the id field if it exists, let Firestore generate it
//     const { id, ...quizData } = quizWithTimestamp;
    
//     const docRef = await addDoc(collection(db, QUIZZES_COLLECTION), quizData);
//     return { id: docRef.id, ...quizData };
//   } catch (error) {
//     console.error('Error saving quiz:', error);
//     throw error;
//   }
// };

// export const updateQuizInFirestore = async (quizId, updates) => {
//   try {
//     const quizRef = doc(db, QUIZZES_COLLECTION, quizId);
    
//     // First check if the document exists
//     const quizDoc = await getDoc(quizRef);
//     if (!quizDoc.exists()) {
//       console.error('Quiz document not found:', quizId);
//       throw new Error(`Quiz with ID ${quizId} not found`);
//     }
    
//     await updateDoc(quizRef, {
//       ...updates,
//       updatedAt: serverTimestamp()
//     });
//     console.log('✅ Quiz updated successfully:', quizId);
//   } catch (error) {
//     console.error('Error updating quiz:', error);
//     throw error;
//   }
// };

// export const deleteQuizFromFirestore = async (quizId) => {
//   try {
//     await deleteDoc(doc(db, QUIZZES_COLLECTION, quizId));
//   } catch (error) {
//     console.error('Error deleting quiz:', error);
//     throw error;
//   }
// };

// export const getQuizzesFromFirestore = async () => {
//   try {
//     const querySnapshot = await getDocs(collection(db, QUIZZES_COLLECTION));
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

// export const getActiveQuizFromFirestore = async () => {
//   try {
//     const q = query(
//       collection(db, QUIZZES_COLLECTION), 
//       where('status', '==', 'active')
//     );
//     const querySnapshot = await getDocs(q);
//     if (!querySnapshot.empty) {
//       const doc = querySnapshot.docs[0];
//       return { id: doc.id, ...doc.data() };
//     }
//     return null;
//   } catch (error) {
//     console.error('Error getting active quiz:', error);
//     throw error;
//   }
// };

// // Real-time listener for active quiz
// export const listenToActiveQuiz = (callback) => {
//   const q = query(
//     collection(db, QUIZZES_COLLECTION), 
//     where('status', '==', 'active')
//   );
  
//   return onSnapshot(q, (querySnapshot) => {
//     if (!querySnapshot.empty) {
//       const doc = querySnapshot.docs[0];
//       callback({ id: doc.id, ...doc.data() });
//     } else {
//       callback(null);
//     }
//   });
// };

// // Results Operations
// export const saveQuizResultToFirestore = async (result) => {
//   try {
//     const resultWithTimestamp = {
//       ...result,
//       submittedAt: serverTimestamp()
//     };
//     const docRef = await addDoc(collection(db, RESULTS_COLLECTION), resultWithTimestamp);
//     return { id: docRef.id, ...result };
//   } catch (error) {
//     console.error('Error saving result:', error);
//     throw error;
//   }
// };

// export const getQuizResultsFromFirestore = async (quizId) => {
//   try {
//     const q = query(
//       collection(db, RESULTS_COLLECTION), 
//       where('quizId', '==', quizId),
//       orderBy('submittedAt', 'desc')
//     );
//     const querySnapshot = await getDocs(q);
//     const results = [];
//     querySnapshot.forEach((doc) => {
//       results.push({ id: doc.id, ...doc.data() });
//     });
//     return results;
//   } catch (error) {
//     console.error('Error getting results:', error);
//     throw error;
//   }
// };

// // Real-time listener for quiz results
// export const listenToQuizResults = (quizId, callback) => {
//   const q = query(
//     collection(db, RESULTS_COLLECTION), 
//     where('quizId', '==', quizId),
//     orderBy('submittedAt', 'desc')
//   );
  
//   return onSnapshot(q, (querySnapshot) => {
//     const results = [];
//     querySnapshot.forEach((doc) => {
//       results.push({ id: doc.id, ...doc.data() });
//     });
//     callback(results);
//   });
// };