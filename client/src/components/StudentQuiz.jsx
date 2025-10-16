// import React, { useState, useEffect } from 'react';
// import { 
//   getActiveQuiz, 
//   getQuizzes, 
//   saveQuizResult, 
//   hasStudentAttempted, 
//   markStudentAttempted, 
//   checkScheduledQuizzes, 
//   debugQuizStatus, 
//   forceStartScheduledQuiz,
//   onActiveQuizChange,
//   onQuizResultsChange 
// } from '../utils/storage';
// import { QuizSynchronizer } from '../utils/quizSync';
// import Timer from './Timer';
// import QuizResults from './QuizResults';
// import FullScreenModal from './FullScreenModal';

// function StudentQuiz() {
//   const [quiz, setQuiz] = useState(null);
//   const [scheduledQuizzes, setScheduledQuizzes] = useState([]);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [answers, setAnswers] = useState([]);
//   const [studentName, setStudentName] = useState('');
//   const [quizStarted, setQuizStarted] = useState(false);
//   const [quizCompleted, setQuizCompleted] = useState(false);
//   const [showFullScreenModal, setShowFullScreenModal] = useState(false);
//   const [studentStartTime, setStudentStartTime] = useState(null);
//   const [missedQuestions, setMissedQuestions] = useState(0);
//   const [connectionStatus, setConnectionStatus] = useState('connected');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Check connection status
//     const handleOnline = () => setConnectionStatus('connected');
//     const handleOffline = () => setConnectionStatus('disconnected');
    
//     window.addEventListener('online', handleOnline);
//     window.addEventListener('offline', handleOffline);
    
//     return () => {
//       window.removeEventListener('online', handleOnline);
//       window.removeEventListener('offline', handleOffline);
//     };
//   }, []);

//   useEffect(() => {
//     // Real-time listener for active quiz
//     const unsubscribe = onActiveQuizChange((activeQuiz) => {
//       console.log('🎯 Active quiz update:', activeQuiz);
//       if (activeQuiz && activeQuiz.status === 'active') {
//         setQuiz(activeQuiz);
//       } else {
//         setQuiz(null);
//       }
//       setLoading(false);
//     });

//     // Load initial data
//     loadInitialData();

//     return () => {
//       if (unsubscribe) unsubscribe();
//     };
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       checkScheduledQuizzesList();
//     }, 5000); // Check every 5 seconds

//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     if (quizStarted && studentStartTime) {
//       const interval = setInterval(() => {
//         syncWithQuiz();
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [quizStarted, studentStartTime]);

//   const loadInitialData = async () => {
//     try {
//       setLoading(true);
//       await checkScheduledQuizzes(); // Check for scheduled quizzes that should start
//       await checkScheduledQuizzesList(); // Load scheduled quizzes
//       setLoading(false);
//     } catch (error) {
//       console.error('Error loading initial data:', error);
//       setLoading(false);
//     }
//   };

//   const checkScheduledQuizzesList = async () => {
//     try {
//       const allQuizzes = await getQuizzes();
//       const now = Date.now();
      
//       const scheduled = allQuizzes.filter(q => 
//         q.scheduledTime && 
//         q.scheduledTime > now && 
//         q.status === 'scheduled'
//       );
      
//       setScheduledQuizzes(scheduled);
//     } catch (error) {
//       console.error('Error checking scheduled quizzes:', error);
//     }
//   };

//   const syncWithQuiz = () => {
//     if (!quiz) return;

//     if (QuizSynchronizer.hasQuizEnded(quiz)) {
//       if (quizStarted && !quizCompleted) {
//         finishQuiz();
//       }
//       return;
//     }

//     if (quizStarted && studentStartTime) {
//       const currentIndex = QuizSynchronizer.getCurrentQuestionIndex(quiz);
//       setCurrentQuestionIndex(currentIndex);
      
//       if (currentIndex >= quiz.questions.length) {
//         finishQuiz();
//       }
//     }
//   };

//   const startQuiz = async () => {
//     if (!studentName.trim()) {
//       alert('Please enter your name');
//       return;
//     }

//     try {
//       const activeQuiz = await getActiveQuiz();
//       if (!activeQuiz) {
//         alert('No active quiz found');
//         return;
//       }

//       const { canJoin, reason, missedQuestions: missed } = QuizSynchronizer.canStudentJoin(activeQuiz, studentName);
      
//       if (!canJoin) {
//         alert(`Cannot join quiz: ${reason}`);
//         return;
//       }

//       if (hasStudentAttempted(activeQuiz.id, studentName)) {
//         alert('You have already attempted this quiz!');
//         return;
//       }

//       setMissedQuestions(missed);
//       setStudentStartTime(Date.now());
//       setShowFullScreenModal(true);
//     } catch (error) {
//       console.error('Error starting quiz:', error);
//       alert('Error starting quiz. Please try again.');
//     }
//   };

//   const handleFullScreenConfirm = async () => {
//     try {
//       const activeQuiz = await getActiveQuiz();
//       if (!activeQuiz) {
//         alert('Quiz no longer available');
//         return;
//       }

//       const currentIndex = QuizSynchronizer.getCurrentQuestionIndex(activeQuiz);
      
//       // Initialize answers array with missed questions as empty
//       const initialAnswers = new Array(activeQuiz.questions.length).fill(null);
//       for (let i = 0; i < missedQuestions; i++) {
//         initialAnswers[i] = ''; // Mark missed questions as unanswered
//       }

//       setAnswers(initialAnswers);
//       setCurrentQuestionIndex(currentIndex);
//       setQuizStarted(true);
//       setShowFullScreenModal(false);
//       markStudentAttempted(activeQuiz.id, studentName);
//     } catch (error) {
//       console.error('Error confirming fullscreen:', error);
//       alert('Error joining quiz. Please try again.');
//     }
//   };

//   const handleAnswer = (answer) => {
//     const newAnswers = [...answers];
//     newAnswers[currentQuestionIndex] = answer;
//     setAnswers(newAnswers);
//   };

//   const handleTimeUp = () => {
//     const newAnswers = [...answers];
//     if (!newAnswers[currentQuestionIndex]) {
//       newAnswers[currentQuestionIndex] = ''; // Mark as unanswered
//     }
//     setAnswers(newAnswers);
//   };

//   const finishQuiz = async () => {
//     try {
//       const activeQuiz = await getActiveQuiz();
//       if (!activeQuiz) {
//         console.error('No active quiz found when finishing');
//         return;
//       }

//       const score = calculateScore();
//       const result = {
//         studentName: studentName.trim(),
//         score,
//         totalQuestions: activeQuiz.questions.length,
//         percentage: Math.round((score / activeQuiz.questions.length) * 100),
//         timestamp: Date.now(),
//         quizId: activeQuiz.id,
//         quizName: activeQuiz.name,
//         quizClass: activeQuiz.class,
//         missedQuestions,
//         answers: answers.map((answer, index) => ({
//           question: activeQuiz.questions[index]?.question || 'Missed question',
//           studentAnswer: answer,
//           correctAnswer: activeQuiz.questions[index]?.correctAnswer || '',
//           isCorrect: answer === activeQuiz.questions[index]?.correctAnswer,
//           wasMissed: index < missedQuestions
//         }))
//       };

//       await saveQuizResult(result);
//       setQuizCompleted(true);
//     } catch (error) {
//       console.error('Error finishing quiz:', error);
//       alert('Error submitting quiz. Please try again.');
//     }
//   };

//   const calculateScore = () => {
//     if (!quiz) return 0;
//     return quiz.questions.reduce((score, question, index) => {
//       if (index < missedQuestions) return score; // Missed questions don't count
//       return score + (answers[index] === question.correctAnswer ? 1 : 0);
//     }, 0);
//   };

//   const joinScheduledQuiz = (scheduledQuiz) => {
//     if (!studentName.trim()) {
//       alert('Please enter your name first');
//       return;
//     }
//     alert(`Quiz "${scheduledQuiz.name}" is scheduled for ${new Date(scheduledQuiz.scheduledTime).toLocaleString()}`);
//   };

//   const handleEmergencyFix = async () => {
//     try {
//       // Get all scheduled quizzes that should have started
//       const allQuizzes = await getQuizzes();
//       const stuckQuizzes = allQuizzes.filter(q => 
//         q.status === 'scheduled' && q.scheduledTime <= Date.now()
//       );
      
//       if (stuckQuizzes.length > 0) {
//         for (const quiz of stuckQuizzes) {
//           console.log('🛠️ Fixing stuck quiz:', quiz.name);
//           await forceStartScheduledQuiz(quiz.id);
//         }
//         alert(`Fixed ${stuckQuizzes.length} stuck quizzes!`);
//         await checkScheduledQuizzesList(); // Refresh
//       } else {
//         alert('No stuck quizzes found');
//       }
//     } catch (error) {
//       console.error('Error in emergency fix:', error);
//       alert('Error fixing quizzes. Please check console.');
//     }
//   };

//   const handleDebugStatus = async () => {
//     try {
//       await debugQuizStatus();
//       await checkScheduledQuizzesList();
//     } catch (error) {
//       console.error('Error in debug:', error);
//     }
//   };

//   // Render different states
//   if (quizCompleted) {
//     return <QuizResults results={calculateScore()} total={quiz?.questions.length || 0} quizId={quiz?.id} missedQuestions={missedQuestions} />;
//   }

//   if (quizStarted && quiz) {
//     return renderQuizInterface();
//   }

//   return renderHomePage();

//   function renderHomePage() {
//     if (loading) {
//       return (
//         <div className="student-home">
//           <div className="home-container">
//             <div className="loading-state">
//               <div className="loader"></div>
//               <h3>Loading Quiz Data...</h3>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="student-home">
//         <div className="home-container">
//           <div className="home-header">
//             <h1>EBI Quiz</h1>
//             <p>Test your knowledge with interactive quizzes</p>
//             <div className="realtime-badge">🔥 Live Updates</div>
//           </div>

//           {/* Active Quiz Section */}
//           {quiz ? (
//             <div className="active-quiz-section">
//               <div className="section-header">
//                 <h2>🎯 Active Quiz</h2>
//                 <span className="live-badge">LIVE</span>
//               </div>
//               <div className="quiz-card active">
//                 <div className="quiz-info">
//                   <h3>{quiz.name}</h3>
//                   <p className="quiz-class">Class: {quiz.class}</p>
//                   <div className="quiz-details">
//                     <div className="detail">
//                       <span>Questions</span>
//                       <strong>{quiz.questions.length}</strong>
//                     </div>
//                     <div className="detail">
//                       <span>Time per Q</span>
//                       <strong>{quiz.timePerQuestion}s</strong>
//                     </div>
//                     <div className="detail">
//                       <span>Total Time</span>
//                       <strong>{Math.ceil(quiz.questions.length * quiz.timePerQuestion / 60)}min</strong>
//                     </div>
//                   </div>
//                   {quiz.startTime && (
//                     <div className="quiz-started-time">
//                       Started at: {new Date(quiz.startTime).toLocaleTimeString()}
//                     </div>
//                   )}
//                 </div>
//                 <div className="join-section">
//                   <input
//                     type="text"
//                     placeholder="Enter your full name"
//                     value={studentName}
//                     onChange={(e) => setStudentName(e.target.value)}
//                     className="name-input"
//                   />
//                   <button onClick={startQuiz} className="join-btn">
//                     Join Quiz Now
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="no-active-quiz">
//               <div className="empty-state">
//                 <div className="empty-icon">📚</div>
//                 <h3>No Active Quiz</h3>
//                 <p>There are no active quizzes at the moment. Check the scheduled quizzes below or wait for an admin to start a quiz.</p>
//               </div>
//             </div>
//           )}

//           {/* Scheduled Quizzes Section */}
//           {scheduledQuizzes.length > 0 && (
//             <div className="scheduled-quizzes-section">
//               <div className="section-header">
//                 <h2>📅 Scheduled Quizzes</h2>
//                 <span className="count-badge">{scheduledQuizzes.length}</span>
//               </div>
//               <div className="scheduled-quizzes-grid">
//                 {scheduledQuizzes.map((scheduledQuiz, index) => (
//                   <div key={scheduledQuiz.id} className="quiz-card scheduled">
//                     <div className="quiz-info">
//                       <h3>{scheduledQuiz.name}</h3>
//                       <p className="quiz-class">Class: {scheduledQuiz.class}</p>
//                       <div className="scheduled-time">
//                         <span>🕒 Starts at: {new Date(scheduledQuiz.scheduledTime).toLocaleString()}</span>
//                       </div>
//                       <div className="time-remaining">
//                         <span>⏰ Starts in: {getTimeRemaining(scheduledQuiz.scheduledTime)}</span>
//                       </div>
//                       <div className="quiz-details">
//                         <div className="detail">
//                           <span>Questions</span>
//                           <strong>{scheduledQuiz.questions?.length || 0}</strong>
//                         </div>
//                         <div className="detail">
//                           <span>Time per Q</span>
//                           <strong>{scheduledQuiz.timePerQuestion}s</strong>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="quiz-actions">
//                       <input
//                         type="text"
//                         placeholder="Your name"
//                         value={studentName}
//                         onChange={(e) => setStudentName(e.target.value)}
//                         className="name-input-small"
//                       />
//                       <button 
//                         onClick={() => joinScheduledQuiz(scheduledQuiz)}
//                         className="remind-btn"
//                       >
//                         Set Reminder
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Debug Section */}
//           <div className="debug-section">
//             <button onClick={handleDebugStatus} className="debug-btn">
//               Debug Quiz Status
//             </button>
//             <button onClick={handleEmergencyFix} className="emergency-btn">
//               🛠️ Fix Stuck Quizzes
//             </button>
//           </div>

//           {/* Connection Status */}
//           <div className="connection-status">
//             Status: <span className={`status-${connectionStatus}`}>
//               {connectionStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
//             </span>
//           </div>
//         </div>

//         {showFullScreenModal && (
//           <FullScreenModal
//             onClose={handleFullScreenConfirm}
//             quizInfo={{
//               name: quiz.name,
//               class: quiz.class,
//               totalQuestions: quiz.questions.length,
//               timePerQuestion: quiz.timePerQuestion,
//               missedQuestions: missedQuestions
//             }}
//           />
//         )}
//       </div>
//     );
//   }

//   function renderQuizInterface() {
//     const currentQuestion = quiz.questions[currentQuestionIndex];
//     const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
//     const isQuestionActive = currentQuestionIndex >= missedQuestions;

//     if (!currentQuestion) {
//       return (
//         <div className="quiz-interface">
//           <div className="question-transition">
//             <h3>Moving to next question...</h3>
//             <div className="loader"></div>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="quiz-interface">
//         {/* Progress Bar */}
//         <div className="progress-bar">
//           <div className="progress-fill" style={{ width: `${progress}%` }}></div>
//           <div className="progress-labels">
//             <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
//             <span>{Math.round(progress)}% Complete</span>
//           </div>
//         </div>

//         {/* Connection Status */}
//         {connectionStatus === 'disconnected' && (
//           <div className="connection-alert">
//             ⚠️ Connection lost - attempting to reconnect...
//           </div>
//         )}

//         <div className="quiz-header">
//           <div className="quiz-meta">
//             <h3>{quiz.name}</h3>
//             <span>Class: {quiz.class}</span>
//           </div>
//           <Timer 
//             duration={quiz.timePerQuestion} 
//             onTimeUp={handleTimeUp}
//             isActive={isQuestionActive}
//           />
//         </div>

//         <div className="question-card">
//           {!isQuestionActive ? (
//             <div className="missed-question">
//               <h4>Question {currentQuestionIndex + 1}</h4>
//               <div className="missed-message">
//                 <span>⏰ You missed this question</span>
//                 <p>You joined the quiz late. This question will be marked as unattempted.</p>
//               </div>
//             </div>
//           ) : (
//             <>
//               <div className="question-text">
//                 <h4>Question {currentQuestionIndex + 1}</h4>
//                 <p>{currentQuestion.question}</p>
//               </div>
              
//               <div className="options-grid">
//                 {currentQuestion.options.map((option, index) => (
//                   <button
//                     key={index}
//                     onClick={() => handleAnswer(option)}
//                     disabled={answers[currentQuestionIndex]}
//                     className={`option-btn ${answers[currentQuestionIndex] === option ? 'selected' : ''}`}
//                   >
//                     <span className="option-label">{String.fromCharCode(65 + index)}</span>
//                     <span className="option-text">{option}</span>
//                     {answers[currentQuestionIndex] === option && (
//                       <span className="option-check">✓</span>
//                     )}
//                   </button>
//                 ))}
//               </div>

//               {answers[currentQuestionIndex] && (
//                 <div className="answer-confirmation">
//                   ✅ Answer selected - waiting for next question...
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         <div className="quiz-footer">
//           <div className="student-info">
//             <span>Student: {studentName}</span>
//             {missedQuestions > 0 && (
//               <span className="missed-count">Missed: {missedQuestions}</span>
//             )}
//           </div>
//           <div className="sync-status">
//             {isQuestionActive ? '🟢 Live' : '⏸️ Waiting'}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Helper function to calculate time remaining
//   function getTimeRemaining(scheduledTime) {
//     const now = Date.now();
//     const timeLeft = scheduledTime - now;
    
//     if (timeLeft <= 0) return 'Starting soon...';
    
//     const hours = Math.floor(timeLeft / (1000 * 60 * 60));
//     const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
//     const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
//     if (hours > 0) {
//       return `${hours}h ${minutes}m ${seconds}s`;
//     } else if (minutes > 0) {
//       return `${minutes}m ${seconds}s`;
//     } else {
//       return `${seconds}s`;
//     }
//   }
// }

// export default StudentQuiz;