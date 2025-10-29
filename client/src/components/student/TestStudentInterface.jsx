
// import React, { useState, useEffect } from 'react';
// import { useQuiz } from '../../contexts/QuizContext';
// import QuizInterface from './QuizInterface';
// import WaitingRoom from './WaitingRoom';
// import CompleteResults from '../admin/CompleteResults';
// import { saveOrUpdateQuizResult, getAllScheduledQuizzes, joinScheduledQuizWaitingRoom } from '../../utils/firestore';

// const StudentQuiz = () => {
//   const { activeQuiz, loading } = useQuiz();
//   const [studentName, setStudentName] = useState(localStorage.getItem('studentName') || '');
//   const [quizStarted, setQuizStarted] = useState(false);
//   const [quizCompleted, setQuizCompleted] = useState(false);
//   const [finalScore, setFinalScore] = useState(null);
//   const [scheduledQuizzes, setScheduledQuizzes] = useState([]);
//   const [inWaitingRoom, setInWaitingRoom] = useState(false);
//   const [loadingScheduled, setLoadingScheduled] = useState(true);
//   const [joiningQuiz, setJoiningQuiz] = useState(null);

//   // Fetch ALL scheduled quizzes
//   // Fetch ALL scheduled quizzes - FIXED with better refresh
//   useEffect(() => {
//     const loadScheduledQuizzes = async () => {
//       try {
//         setLoadingScheduled(true);
//         const quizzes = await getAllScheduledQuizzes();
//         console.log('📅 Refreshed scheduled quizzes:', quizzes.length, quizzes);
//         setScheduledQuizzes(quizzes);
//       } catch (error) {
//         console.error('Error loading scheduled quizzes:', error);
//         setScheduledQuizzes([]);
//       } finally {
//         setLoadingScheduled(false);
//       }
//     };

//     loadScheduledQuizzes();
//     const interval = setInterval(loadScheduledQuizzes, 10000);
//     return () => clearInterval(interval);
//   }, []);
//   // Handle quiz state transitions
//   useEffect(() => {
//     if (!activeQuiz || !studentName.trim()) return;

//     console.log('🔄 Quiz status:', activeQuiz.status);
//     console.log('👤 Student in waiting room:', inWaitingRoom);

//     // If student is in waiting room and quiz becomes active, start quiz immediately
//     if (activeQuiz.status === 'active' && inWaitingRoom && !quizStarted) {
//       console.log('🎬 Auto-starting quiz from waiting room');
//       setQuizStarted(true);
//       setInWaitingRoom(false);
//     }

//     // If quiz ends, reset everything
//     if (activeQuiz.status === 'inactive') {
//       console.log('🛑 Quiz ended');
//       setQuizStarted(false);
//       setInWaitingRoom(false);
//     }
//   }, [activeQuiz, studentName, inWaitingRoom, quizStarted]);

//   // Enhanced quiz validation
//   const validateQuizData = (quiz) => {
//     if (!quiz) {
//       console.error('No quiz data provided');
//       return false;
//     }

//     if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
//       console.error('Invalid or empty questions array');
//       return false;
//     }

//     const hasValidQuestions = quiz.questions.every(q =>
//       q &&
//       typeof q === 'object' &&
//       q.question &&
//       q.options &&
//       Array.isArray(q.options) &&
//       q.options.length >= 2 &&
//       q.correctAnswer
//     );

//     if (!hasValidQuestions) {
//       console.error('Some questions are missing required fields');
//       return false;
//     }

//     console.log('✅ Quiz validation passed - questions are valid');
//     return true;
//   };

//   // Handle joining scheduled quiz
//   const handleJoinScheduledQuiz = async (quiz) => {
//     if (!studentName.trim()) {
//       alert('Please enter your name first.');
//       return;
//     }

//     // Validate quiz data before joining
//     if (!validateQuizData(quiz)) {
//       alert('This quiz has configuration issues. Please contact your instructor.');
//       return;
//     }

//     setJoiningQuiz(quiz.id);
//     try {
//       localStorage.setItem('studentName', studentName.trim());

//       if (quiz.status === 'activated' || quiz.status === 'scheduled') {
//         // Join waiting room
//         const result = await joinScheduledQuizWaitingRoom(quiz.id, studentName.trim());
//         if (result.success) {
//           console.log('✅ Joined waiting room for scheduled quiz');
//           setInWaitingRoom(true);
//         }
//       }
//     } catch (error) {
//       console.error('Error joining scheduled quiz:', error);
//       alert(`Error joining quiz: ${error.message}`);
//     } finally {
//       setJoiningQuiz(null);
//     }
//   };

//   // Handle joining active quiz directly
//   const handleJoinActiveQuiz = () => {
//     if (!studentName.trim()) {
//       alert('Please enter your name first.');
//       return;
//     }

//     if (!validateQuizData(activeQuiz)) {
//       alert('This quiz has configuration issues. Please contact your instructor.');
//       return;
//     }

//     localStorage.setItem('studentName', studentName.trim());
//     setQuizStarted(true);
//   };

//   // FIXED: Handle quiz completion with consistent quiz ID
//   const handleQuizComplete = async (score) => {
//     console.log('🏁 Quiz Complete - Fixing result mismatch');

//     const numericScore = Number(score) || 0;
//     setFinalScore(numericScore);
//     setQuizCompleted(true);
//     setQuizStarted(false);

//     try {
//       if (activeQuiz && validateQuizData(activeQuiz)) {
//         const totalQuestions = activeQuiz.questions?.length || 0;
//         const percentage = totalQuestions > 0 ? Math.round((numericScore / totalQuestions) * 100) : 0;

//         // FIX: Use consistent quiz ID (originalQuizId for scheduled quizzes)
//         const quizIdToUse = activeQuiz.originalQuizId || activeQuiz.id;

//         const result = {
//           studentName: studentName.trim(),
//           score: numericScore,
//           totalQuestions: totalQuestions,
//           percentage: percentage,
//           quizId: quizIdToUse, // Use consistent ID
//           quizName: activeQuiz.name,
//           quizClass: activeQuiz.class,
//           completedAt: Date.now(),
//           joinTime: Date.now()
//         };

//         console.log('💾 Saving result with quiz ID:', quizIdToUse);
//         await saveOrUpdateQuizResult(result);
//       }
//     } catch (error) {
//       console.error('❌ Error saving result:', error);
//     }
//   };

//   const handleRetakeQuiz = () => {
//     setQuizCompleted(false);
//     setFinalScore(null);
//   };

//   // Check if quiz is ready to join
//   const isQuizReadyToJoin = (quiz) => {
//     const isScheduledOrActivated = quiz.status === 'scheduled' || quiz.status === 'activated';
//     const noActiveQuiz = !activeQuiz || activeQuiz.status === 'inactive';
//     const isValidQuiz = validateQuizData(quiz);
//     const isNotCompleted = quiz.status !== 'completed'; // NEW: Exclude completed quizzes

//     return isScheduledOrActivated && noActiveQuiz && isValidQuiz && isNotCompleted;
//   };

//   // Check if quiz is activated but waiting
//   const isQuizActivated = (quiz) => {
//     return quiz.status === 'activated';
//   };

//   // Get time display
//   const getTimeDisplay = (quiz) => {
//     if (quiz.status === 'activated') {
//       return 'Waiting for admin to start';
//     } else if (quiz.status === 'scheduled') {
//       return `Scheduled for ${new Date(quiz.scheduledTime).toLocaleString()}`;
//     }
//     return 'Ready to join';
//   };

//   // Get quiz status for display
//   const getQuizStatus = (quiz) => {
//     if (isQuizActivated(quiz)) {
//       return 'activated';
//     } else if (isQuizReadyToJoin(quiz)) {
//       return 'ready';
//     } else {
//       return 'upcoming';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading Quiz Platform...</p>
//       </div>
//     );
//   }

//   // Render logic
//   if (inWaitingRoom && activeQuiz) {
//     return <WaitingRoom activeQuiz={activeQuiz} studentName={studentName} />;
//   }

//   // In StudentQuiz.js - Replace the quizCompleted section
//   if (quizCompleted && activeQuiz) {
//     return (
//       <CompleteResults
//         score={finalScore}
//         activeQuiz={activeQuiz}
//         studentName={studentName}
//         onRetake={handleRetakeQuiz}
//       />
//     );
//   }

//   if (quizStarted && activeQuiz) {
//     return (
//       <div className="quiz-container">
//         <QuizInterface
//           activeQuiz={activeQuiz}
//           studentName={studentName}
//           onQuizComplete={handleQuizComplete}
//         />
//       </div>
//     );
//   }

//   // Show active quiz join option
//   if (activeQuiz && activeQuiz.status === 'active') {
//     return (
//       <div className="student-portal">
//         <div className="portal-container">
//           <div className="active-quiz-banner">
//             <div className="banner-icon">🎯</div>
//             <div className="banner-content">
//               <h2>Active Quiz Running!</h2>
//               <p><strong>{activeQuiz.name}</strong> is currently active. You can join now.</p>
//               <div className="quiz-details">
//                 <span>🏫 {activeQuiz.class}</span>
//                 <span>📝 {activeQuiz.questions?.length || 0} Questions</span>
//                 <span>⏱️ {activeQuiz.timePerQuestion}s per question</span>
//               </div>
//             </div>
//             <button
//               className="join-active-btn"
//               onClick={handleJoinActiveQuiz}
//             >
//               🚀 Join Active Quiz
//             </button>
//           </div>

//           <div className="student-info-section">
//             <h3>Enter Your Name to Join</h3>
//             <input
//               type="text"
//               placeholder="Enter your full name"
//               value={studentName}
//               onChange={(e) => setStudentName(e.target.value)}
//               className="portal-input"
//               maxLength={50}
//             />
//             {studentName.trim() && (
//               <div className="welcome-message">
//                 Welcome, <strong>{studentName}</strong>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//     );
//   }

//   // Show portal with scheduled quizzes
//   return (
//     <div className="student-portal">
//       <div className="portal-container">
//         <div className="portal-header">
//           <div className="brand-section">
//             <div className="brand-logo">🎯</div>
//             <h1>EBI Quiz Platform</h1>
//             <p>Professional Assessment System</p>
//           </div>

//           <div className="student-info-card">
//             <h3>Student Information</h3>
//             <input
//               type="text"
//               placeholder="Enter your full name"
//               value={studentName}
//               onChange={(e) => setStudentName(e.target.value)}
//               className="portal-input"
//               maxLength={50}
//             />
//             {studentName.trim() && (
//               <div className="welcome-message">
//                 Welcome, <strong>{studentName}</strong>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="portal-content">
//           {/* Quiz Portal Section */}
//           <div className="upcoming-quizzes-section">
//             <div className="section-header">
//               <h2>📅 Quiz Portal</h2>
//               <p>Join scheduled quizzes or active sessions</p>
//             </div>

//             {loadingScheduled ? (
//               <div className="loading-upcoming">
//                 <div className="loading-spinner-small"></div>
//                 <p>Loading quizzes...</p>
//               </div>
//             ) : scheduledQuizzes.length > 0 ? (
//               <div className="upcoming-quizzes-grid">
//                 {scheduledQuizzes.map((quiz) => {
//                   const quizStatus = getQuizStatus(quiz);
//                   const canJoin = (quizStatus === 'ready' || quizStatus === 'activated') && studentName.trim() && !joiningQuiz;
//                   const isValidQuiz = validateQuizData(quiz);

//                   return (
//                     <div key={quiz.id} className="upcoming-quiz-card">
//                       <div className="quiz-card-header">
//                         <h4>{quiz.name}</h4>
//                         <span className={`upcoming-badge ${quizStatus}`}>
//                           {quizStatus === 'activated' ? 'WAITING FOR ADMIN' :
//                             quizStatus === 'ready' ? 'READY TO JOIN' : 'SCHEDULED'}
//                         </span>
//                         {!isValidQuiz && (
//                           <span className="error-badge">INVALID</span>
//                         )}
//                       </div>

//                       <div className="quiz-card-details">
//                         <div className="detail-item">
//                           <span className="detail-icon">🏫</span>
//                           <span>{quiz.class}</span>
//                         </div>
//                         <div className="detail-item">
//                           <span className="detail-icon">📝</span>
//                           <span>{quiz.questions?.length || 0} Questions</span>
//                           {!isValidQuiz && (
//                             <span style={{ color: '#dc3545', marginLeft: '5px' }}>⚠️</span>
//                           )}
//                         </div>
//                         <div className="detail-item">
//                           <span className="detail-icon">⏱️</span>
//                           <span>{quiz.timePerQuestion}s per question</span>
//                         </div>
//                         <div className="detail-item">
//                           <span className="detail-icon">🕒</span>
//                           <span className={`time-display ${quizStatus}`}>
//                             {getTimeDisplay(quiz)}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="quiz-scheduled-time">
//                         <strong>Originally Scheduled:</strong> {new Date(quiz.scheduledTime).toLocaleString()}
//                       </div>

//                       <div className="quiz-card-actions">
//                         {(quizStatus === 'ready' || quizStatus === 'activated') ? (
//                           <button
//                             className={`btn-join ${canJoin && isValidQuiz ? 'enabled' : 'disabled'}`}
//                             onClick={() => handleJoinScheduledQuiz(quiz)}
//                             disabled={!canJoin || !isValidQuiz}
//                             title={!isValidQuiz ? 'Quiz has configuration issues' : ''}
//                           >
//                             {joiningQuiz === quiz.id ? (
//                               <>⏳ Joining...</>
//                             ) : (
//                               <>🚪 Enter Waiting Room</>
//                             )}
//                           </button>
//                         ) : (
//                           <button className="btn-remind-me" disabled>
//                             ⏰ Coming Soon
//                           </button>
//                         )}
//                       </div>

//                       {!studentName.trim() && (quizStatus === 'ready' || quizStatus === 'activated') && (
//                         <div className="join-hint">
//                           💡 Enter your name above to join
//                         </div>
//                       )}

//                       {!isValidQuiz && (
//                         <div className="error-message">
//                           ⚠️ This quiz has configuration issues
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             ) : (
//               <div className="no-upcoming-quizzes">
//                 <div className="empty-state-icon">📚</div>
//                 <h3>No Scheduled Quizzes</h3>
//                 <p>There are no scheduled quizzes at the moment. Check back later for new assessments.</p>
//               </div>
//             )}
//           </div>

//           <div className="info-grid">
//             <div className="info-card">
//               <div className="card-icon">⚡</div>
//               <h4>Instant Access</h4>
//               <p>Join assessments with your registered name</p>
//             </div>
//             <div className="info-card">
//               <div className="card-icon">🛡️</div>
//               <h4>Secure Environment</h4>
//               <p>Protected testing environment</p>
//             </div>
//             <div className="info-card">
//               <div className="card-icon">📊</div>
//               <h4>Real-time Results</h4>
//               <p>Immediate performance feedback</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         .student-portal {
//           min-height: 100vh;
//           background: linear-gradient(135deg, #023e8a 0%, #0077b6 100%);
//           padding: 40px 20px;
//         }

//         .portal-container {
//           max-width: 1200px;
//           margin: 0 auto;
//         }

//         .active-quiz-banner {
//           background: linear-gradient(135deg, #28a745, #20c997);
//           color: white;
//           padding: 30px;
//           border-radius: 20px;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           margin-bottom: 30px;
//           box-shadow: 0 15px 35px rgba(40, 167, 69, 0.3);
//         }

//         .banner-icon {
//           font-size: 3rem;
//           margin-right: 20px;
//         }

//         .banner-content {
//           flex: 1;
//         }

//         .banner-content h2 {
//           margin: 0 0 10px 0;
//           font-size: 1.8rem;
//         }

//         .banner-content p {
//           margin: 0 0 15px 0;
//           opacity: 0.9;
//         }

//         .quiz-details {
//           display: flex;
//           gap: 15px;
//           flex-wrap: wrap;
//         }

//         .quiz-details span {
//           background: rgba(255, 255, 255, 0.2);
//           padding: 5px 12px;
//           border-radius: 15px;
//           font-size: 0.9rem;
//         }

//         .join-active-btn {
//           background: white;
//           color: #28a745;
//           border: none;
//           padding: 12px 25px;
//           border-radius: 10px;
//           font-weight: 700;
//           cursor: pointer;
//           transition: all 0.3s ease;
//         }

//         .join-active-btn:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
//         }

//         .student-info-section {
//           background: rgba(255, 255, 255, 0.95);
//           padding: 25px;
//           border-radius: 15px;
//           margin-bottom: 30px;
//         }

//         .student-info-section h3 {
//           color: #2c3e50;
//           margin-bottom: 15px;
//         }

//         /* Rest of the CSS remains the same as previous version */
//         .portal-header {
//           text-align: center;
//           margin-bottom: 60px;
//         }

//         .brand-section {
//           margin-bottom: 40px;
//         }

//         .brand-logo {
//           font-size: 4rem;
//           margin-bottom: 20px;
//         }

//         .brand-section h1 {
//           color: white;
//           font-size: 3rem;
//           margin-bottom: 10px;
//           font-weight: 800;
//         }

//         .brand-section p {
//           color: rgba(255, 255, 255, 0.8);
//           font-size: 1.2rem;
//           margin: 0;
//         }

//         .student-info-card {
//           background: rgba(255, 255, 255, 0.95);
//           backdrop-filter: blur(20px);
//           padding: 30px;
//           border-radius: 20px;
//           max-width: 400px;
//           margin: 0 auto;
//           box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
//         }

//         .student-info-card h3 {
//           color: #2c3e50;
//           margin-bottom: 20px;
//           text-align: center;
//         }

//         .portal-input {
//           // width: 100%;
//           padding: 15px 20px;
//           border: 2px solid #e9ecef;
//           border-radius: 12px;
//           font-size: 1rem;
//           margin-bottom: 15px;
//           transition: all 0.3s ease;
//         }

//         .portal-input:focus {
//           outline: none;
//           border-color: #667eea;
//           box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
//         }

//         .welcome-message {
//           text-align: center;
//           color: #28a745;
//           font-weight: 600;
//         }

//         .portal-content {
//           margin-top: 40px;
//         }

//         /* ... rest of the existing CSS ... */
//         .upcoming-quizzes-section {
//           margin-bottom: 60px;
//         }

//         .section-header {
//           text-align: center;
//           margin-bottom: 40px;
//         }

//         .section-header h2 {
//           color: white;
//           font-size: 2.5rem;
//           margin-bottom: 10px;
//           font-weight: 700;
//         }

//         .section-header p {
//           color: rgba(255, 255, 255, 0.8);
//           font-size: 1.1rem;
//           margin: 0;
//         }

//         .loading-upcoming {
//           text-align: center;
//           padding: 40px;
//           background: rgba(255, 255, 255, 0.1);
//           border-radius: 16px;
//           backdrop-filter: blur(10px);
//         }

//         .loading-spinner-small {
//           width: 30px;
//           height: 30px;
//           border: 3px solid rgba(255, 255, 255, 0.3);
//           border-top: 3px solid white;
//           border-radius: 50%;
//           animation: spin 1s linear infinite;
//           margin: 0 auto 15px;
//         }

//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }

//         .upcoming-quizzes-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
//           gap: 25px;
//           margin-bottom: 30px;
//         }

//         .upcoming-quiz-card {
//           background: rgba(255, 255, 255, 0.95);
//           backdrop-filter: blur(20px);
//           border-radius: 20px;
//           padding: 25px;
//           box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
//           border: 1px solid rgba(255, 255, 255, 0.2);
//           transition: transform 0.3s ease, box-shadow 0.3s ease;
//         }

//         .upcoming-quiz-card:hover {
//           transform: translateY(-5px);
//           box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
//         }

//         .quiz-card-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           margin-bottom: 20px;
//         }

//         .quiz-card-header h4 {
//           color: #2c3e50;
//           margin: 0;
//           font-size: 1.3rem;
//           font-weight: 700;
//           flex: 1;
//           margin-right: 15px;
//         }

//         .upcoming-badge {
//           padding: 6px 12px;
//           border-radius: 20px;
//           font-size: 0.75rem;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//           white-space: nowrap;
//         }

//         .upcoming-badge.upcoming {
//           background: linear-gradient(135deg, #ff6b6b, #ee5a52);
//           color: white;
//         }

//         .upcoming-badge.ready {
//           background: linear-gradient(135deg, #28a745, #20c997);
//           color: white;
//         }

//         .upcoming-badge.activated {
//           background: linear-gradient(135deg, #ffc107, #ffca28);
//           color: #856404;
//         }

//         .error-badge {
//           background: #dc3545;
//           color: white;
//           padding: 4px 8px;
//           border-radius: 12px;
//           font-size: 0.7rem;
//           font-weight: 700;
//           margin-left: 8px;
//         }

//         .quiz-card-details {
//           display: flex;
//           flex-direction: column;
//           gap: 12px;
//           margin-bottom: 20px;
//         }

//         .detail-item {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           color: #5a6c7d;
//           font-size: 0.95rem;
//         }

//         .detail-icon {
//           font-size: 1.1rem;
//           width: 20px;
//           text-align: center;
//         }

//         .time-display {
//           color: #6c757d;
//           font-weight: 600;
//         }

//         .time-display.ready {
//           color: #28a745;
//           font-weight: 700;
//         }

//         .time-display.activated {
//           color: #ffc107;
//           font-weight: 600;
//         }

//         .quiz-scheduled-time {
//           background: rgba(255, 193, 7, 0.1);
//           padding: 12px 15px;
//           border-radius: 12px;
//           border: 1px solid rgba(255, 193, 7, 0.3);
//           color: #856404;
//           font-size: 0.9rem;
//           margin-bottom: 20px;
//           text-align: center;
//         }

//         .quiz-card-actions {
//           text-align: center;
//           margin-bottom: 10px;
//         }

//         .btn-join {
//           width: 100%;
//           padding: 12px 20px;
//           border: none;
//           border-radius: 10px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.3s ease;
//         }

//         .btn-join.enabled {
//           background: linear-gradient(135deg, #28a745, #20c997);
//           color: white;
//         }

//         .btn-join.enabled:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 8px 20px rgba(40, 167, 69, 0.3);
//         }

//         .btn-join.disabled {
//           background: #6c757d;
//           color: white;
//           cursor: not-allowed;
//           opacity: 0.6;
//         }

//         .btn-remind-me {
//           width: 100%;
//           background: rgba(108, 117, 125, 0.1);
//           border: 1px solid rgba(108, 117, 125, 0.3);
//           color: #6c757d;
//           padding: 12px 20px;
//           border-radius: 10px;
//           font-size: 0.9rem;
//           cursor: not-allowed;
//           transition: all 0.3s ease;
//         }

//         .join-hint {
//           text-align: center;
//           color: #17a2b8;
//           font-size: 0.85rem;
//           font-weight: 600;
//           padding: 8px;
//           background: rgba(23, 162, 184, 0.1);
//           border-radius: 8px;
//         }

//         .error-message {
//           background: rgba(220, 53, 69, 0.1);
//           color: #dc3545;
//           padding: 10px;
//           border-radius: 8px;
//           text-align: center;
//           font-size: 0.9rem;
//           margin-top: 10px;
//           border: 1px solid rgba(220, 53, 69, 0.2);
//         }

//         .no-upcoming-quizzes {
//           text-align: center;
//           padding: 60px 40px;
//           background: rgba(255, 255, 255, 0.1);
//           border-radius: 20px;
//           backdrop-filter: blur(10px);
//           border: 1px solid rgba(255, 255, 255, 0.2);
//         }

//         .empty-state-icon {
//           font-size: 4rem;
//           margin-bottom: 20px;
//           opacity: 0.7;
//         }

//         .no-upcoming-quizzes h3 {
//           color: white;
//           margin-bottom: 15px;
//           font-size: 1.5rem;
//         }

//         .no-upcoming-quizzes p {
//           color: rgba(255, 255, 255, 0.8);
//           margin: 0;
//           line-height: 1.6;
//         }

//         .active-quiz-notice {
//           background: rgba(40, 167, 69, 0.1);
//           border: 2px solid #28a745;
//           border-radius: 15px;
//           padding: 25px;
//           text-align: center;
//           margin: 30px 0;
//           backdrop-filter: blur(10px);
//         }

//         .notice-icon {
//           font-size: 3rem;
//           margin-bottom: 15px;
//         }

//         .active-quiz-notice h3 {
//           color: #28a745;
//           margin-bottom: 10px;
//           font-size: 1.4rem;
//         }

//         .active-quiz-notice p {
//           color: #155724;
//           margin: 0;
//           font-size: 1rem;
//         }

//         .info-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//           gap: 30px;
//           max-width: 1000px;
//           margin: 0 auto 40px;
//         }

//         .info-card {
//           background: rgba(255, 255, 255, 0.95);
//           backdrop-filter: blur(20px);
//           padding: 30px;
//           border-radius: 20px;
//           text-align: center;
//           box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
//           transition: transform 0.3s ease;
//           border: 1px solid rgba(255, 255, 255, 0.2);
//         }

//         .info-card:hover {
//           transform: translateY(-5px);
//         }

//         .card-icon {
//           font-size: 3rem;
//           margin-bottom: 20px;
//         }

//         .info-card h4 {
//           color: #2c3e50;
//           margin-bottom: 15px;
//           font-size: 1.3rem;
//         }

//         .info-card p {
//           color: #6c757d;
//           line-height: 1.6;
//           margin: 0;
//         }

//         .loading-container {
//           min-height: 100vh;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           color: white;
//         }

//         .loading-spinner {
//           width: 50px;
//           height: 50px;
//           border: 4px solid rgba(255, 255, 255, 0.3);
//           border-top: 4px solid white;
//           border-radius: 50%;
//           animation: spin 1s linear infinite;
//           margin-bottom: 20px;
//         }

//         @media (max-width: 768px) {
//           .brand-section h1 {
//             font-size: 2.2rem;
//           }

//           .section-header h2 {
//             font-size: 2rem;
//           }

//           .upcoming-quizzes-grid {
//             grid-template-columns: 1fr;
//           }

//           .student-info-card {
//             margin: 0 20px;
//           }

//           .info-grid {
//             grid-template-columns: 1fr;
//           }

//           .quiz-card-header {
//             flex-direction: column;
//             gap: 10px;
//           }

//           .quiz-card-header h4 {
//             margin-right: 0;
//           }
//       }
//           // Add this CSS to the existing StudentQuiz.js styles

// .active-quiz-banner {
//   background: linear-gradient(135deg, #28a745, #20c997);
//   color: white;
//   padding: 30px;
//   border-radius: 20px;
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   margin-bottom: 30px;
//   box-shadow: 0 15px 35px rgba(40, 167, 69, 0.3);
//   animation: slideIn 0.6s ease-out;
// }

// @keyframes slideIn {
//   from {
//     opacity: 0;
//     transform: translateY(-20px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }

// .banner-icon {
//   font-size: 3rem;
//   margin-right: 20px;
//   animation: bounce 2s ease-in-out infinite;
// }

// @keyframes bounce {
//   0%, 100% { transform: translateY(0); }
//   50% { transform: translateY(-5px); }
// }

// .banner-content {
//   flex: 1;
// }

// .banner-content h2 {
//   margin: 0 0 10px 0;
//   font-size: 1.8rem;
//   font-weight: 700;
// }

// .banner-content p {
//   margin: 0 0 15px 0;
//   opacity: 0.9;
//   font-size: 1.1rem;
// }

// .quiz-details {
//   display: flex;
//   gap: 15px;
//   flex-wrap: wrap;
// }

// .quiz-details span {
//   background: rgba(255, 255, 255, 0.2);
//   padding: 6px 12px;
//   border-radius: 15px;
//   font-size: 0.9rem;
//   font-weight: 600;
// }

// .join-active-btn {
//   background: white;
//   color: #28a745;
//   border: none;
//   padding: 15px 30px;
//   border-radius: 12px;
//   font-weight: 700;
//   font-size: 1.1rem;
//   cursor: pointer;
//   transition: all 0.3s ease;
//   box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
// }

// .join-active-btn:hover {
//   transform: translateY(-3px);
//   box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
// }

// .student-info-section {
//   background: rgba(255, 255, 255, 0.95);
//   backdrop-filter: blur(20px);
//   padding: 25px;
//   border-radius: 15px;
//   margin-bottom: 30px;
//   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
//   border: 1px solid rgba(255, 255, 255, 0.2);
// }

// .student-info-section h3 {
//   color: #2c3e50;
//   margin-bottom: 20px;
//   text-align: center;
//   font-size: 1.3rem;
// }

// .student-info-section .portal-input {
//   // 


//   padding: 15px 20px;
//   border: 2px solid #e9ecef;
//   border-radius: 12px;
//   font-size: 1rem;
//   margin-bottom: 15px;
//   transition: all 0.3s ease;
// }

// .student-info-section .portal-input:focus {
//   outline: none;
//   border-color: #667eea;
//   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
// }

// .student-info-section .welcome-message {
//   text-align: center;
//   color: #28a745;
//   font-weight: 600;
//   font-size: 1rem;
// }
//   // Add this to the StudentQuiz.js styles section
// /* Add this to the main style section instead of separate blocks */
// .quiz-portal-active {
//   min-height: 100vh;
//   background: linear-gradient(135deg, #023e8a 0%, #0077b6 100%);
//   padding: 40px 20px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
// }

// .quiz-portal-container {
//   max-width: 600px;
//   width: 100%;
// }

// .active-quiz-banner {
//   background: rgba(255, 255, 255, 0.95);
//   backdrop-filter: blur(20px);
//   border-radius: 20px;
//   padding: 40px;
//   text-align: center;
//   box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
//   border: 1px solid rgba(255, 255, 255, 0.3);
//   margin-bottom: 30px;
//   animation: slideIn 0.6s ease-out;
// }

// @keyframes slideIn {
//   from {
//     opacity: 0;
//     transform: translateY(-30px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }

// .banner-icon {
//   font-size: 4rem;
//   margin-bottom: 20px;
//   animation: bounce 2s ease-in-out infinite;
// }

// @keyframes bounce {
//   0%, 100% { transform: translateY(0); }
//   50% { transform: translateY(-10px); }
// }

// .banner-content h2 {
//   color: #2c3e50;
//   margin-bottom: 15px;
//   font-size: 2.2rem;
//   font-weight: 700;
// }

// .banner-content p {
//   color: #6c757d;
//   margin-bottom: 20px;
//   font-size: 1.1rem;
//   line-height: 1.6;
// }

// .quiz-details-grid {
//   display: grid;
//   grid-template-columns: repeat(2, 1fr);
//   gap: 15px;
//   margin: 25px 0;
// }

// .quiz-detail-item {
//   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//   color: white;
//   padding: 15px;
//   border-radius: 12px;
//   text-align: center;
// }

// .detail-value {
//   display: block;
//   font-size: 1.4rem;
//   font-weight: 800;
//   margin-bottom: 5px;
// }

// .detail-label {
//   display: block;
//   font-size: 0.8rem;
//   opacity: 0.9;
// }

// .join-active-btn {
//   background: linear-gradient(135deg, #28a745, #20c997);
//   color: white;
//   border: none;
//   padding: 16px 40px;
//   border-radius: 12px;
//   font-size: 1.2rem;
//   font-weight: 700;
//   cursor: pointer;
//   transition: all 0.3s ease;
//   box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
//   width: 100%;
//   margin-top: 20px;
// }

// .join-active-btn:hover {
//   transform: translateY(-3px);
//   box-shadow: 0 12px 35px rgba(40, 167, 69, 0.4);
// }

// .student-info-card {
//   background: rgba(255, 255, 255, 0.95);
//   backdrop-filter: blur(20px);
//   padding: 30px;
//   border-radius: 20px;
//   box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
//   border: 1px solid rgba(255, 255, 255, 0.2);
// }

// .student-info-card h3 {
//   color: #2c3e50;
//   margin-bottom: 20px;
//   text-align: center;
//   font-size: 1.3rem;
// }

// .name-input {
//   width: 100%;
//   padding: 15px 20px;
//   border: 2px solid #e9ecef;
//   border-radius: 12px;
//   font-size: 1rem;
//   margin-bottom: 15px;
//   transition: all 0.3s ease;
// }

// .name-input:focus {
//   outline: none;
//   border-color: #667eea;
//   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
// }

// .welcome-text {
//   text-align: center;
//   color: #28a745;
//   font-weight: 600;
//   font-size: 1rem;
//   margin-top: 10px;
// }
//    /* Active Quiz Banner Styles */
// .active-quiz-banner {
//   background: linear-gradient(135deg, #28a745, #20c997);
//   color: white;
//   padding: 30px;
//   border-radius: 20px;
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   margin-bottom: 30px;
//   box-shadow: 0 15px 35px rgba(40, 167, 69, 0.3);
//   animation: slideIn 0.6s ease-out;
// }

// @keyframes slideIn {
//   from {
//     opacity: 0;
//     transform: translateY(-20px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }

// .banner-icon {
//   font-size: 3rem;
//   margin-right: 20px;
//   animation: bounce 2s ease-in-out infinite;
// }

// @keyframes bounce {
//   0%, 100% { transform: translateY(0); }
//   50% { transform: translateY(-5px); }
// }

// .banner-content {
//   flex: 1;
// }

// .banner-content h2 {
//   margin: 0 0 10px 0;
//   font-size: 1.8rem;
//   font-weight: 700;
// }

// .banner-content p {
//   margin: 0 0 15px 0;
//   opacity: 0.9;
//   font-size: 1.1rem;
// }

// .quiz-details {
//   display: flex;
//   gap: 15px;
//   flex-wrap: wrap;
// }

// .quiz-details span {
//   background: rgba(255, 255, 255, 0.2);
//   padding: 6px 12px;
//   border-radius: 15px;
//   font-size: 0.9rem;
//   font-weight: 600;
// }

// .join-active-btn {
//   background: white;
//   color: #28a745;
//   border: none;
//   padding: 12px 25px;
//   border-radius: 10px;
//   font-weight: 700;
//   cursor: pointer;
//   transition: all 0.3s ease;
//   box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
// }

// .join-active-btn:hover {
//   transform: translateY(-2px);
//   box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
// }

// /* Student Info Section */
// .student-info-section {
//   background: rgba(255, 255, 255, 0.95);
//   backdrop-filter: blur(20px);
//   padding: 25px;
//   border-radius: 15px;
//   margin-bottom: 30px;
//   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
//   border: 1px solid rgba(255, 255, 255, 0.2);
// }

// .student-info-section h3 {
//   color: #2c3e50;
//   margin-bottom: 20px;
//   text-align: center;
//   font-size: 1.3rem;
// }

// .portal-input {
//   // width: 100%;
//   padding: 15px 20px;
//   border: 2px solid #e9ecef;
//   border-radius: 12px;
//   font-size: 1rem;
//   margin-bottom: 15px;
//   transition: all 0.3s ease;
// }

// .portal-input:focus {
//   outline: none;
//   border-color: #667eea;
//   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
// }

// .welcome-message {
//   text-align: center;
//   color: #28a745;
//   font-weight: 600;
//   font-size: 1rem;
// }

// /* Mobile Responsive */
// @media (max-width: 768px) {
//   .active-quiz-banner {
//     flex-direction: column;
//     text-align: center;
//     gap: 20px;
//     padding: 25px;
//   }

//   .banner-icon {
//     margin-right: 0;
//     margin-bottom: 10px;
//   }

//   .banner-content h2 {
//     font-size: 1.6rem;
//   }

//   .quiz-details {
//     justify-content: center;
//   }

//   .join-active-btn {
//     width: 100%;
//     padding: 15px;
//   }
// }

// @media (max-width: 480px) {
//   .active-quiz-banner {
//     padding: 20px;
//     border-radius: 16px;
//   }

//   .banner-icon {
//     font-size: 2.5rem;
//   }

//   .banner-content h2 {
//     font-size: 1.4rem;
//   }

//   .banner-content p {
//     font-size: 1rem;
//   }

//   .quiz-details {
//     flex-direction: column;
//     gap: 8px;
//     align-items: center;
//   }

//   .student-info-section {
//     padding: 20px;
//   }

//   .student-info-section h3 {
//     font-size: 1.2rem;
//   }
// }
//       `}</style>
//     </div>
//   );
// };

// export default StudentQuiz;

import React, { useState, useEffect } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import QuizInterface from './QuizInterface';
import WaitingRoom from './WaitingRoom';
import CompleteResults from '../admin/CompleteResults';
import {
  saveOrUpdateQuizResult, 
  getAllScheduledQuizzes, 
  joinScheduledQuizWaitingRoom,
  verifyQuizPasskey,
  joinScheduledQuizWithPasskey,
  checkDuplicateStudentName,
  getActiveQuizFromFirestore
} from '../../utils/firestore';
import "./student.css";

const StudentQuiz = () => {
  const { activeQuiz, loading } = useQuiz();
  const [studentName, setStudentName] = useState(localStorage.getItem('studentName') || '');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [scheduledQuizzes, setScheduledQuizzes] = useState([]);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [joiningQuiz, setJoiningQuiz] = useState(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [nameValidation, setNameValidation] = useState({ valid: false, message: '' });

  // Fetch ALL scheduled quizzes
  useEffect(() => {
    const loadScheduledQuizzes = async () => {
      try {
        setLoadingScheduled(true);
        const quizzes = await getAllScheduledQuizzes();
        console.log('📅 Refreshed scheduled quizzes:', quizzes.length, quizzes);
        setScheduledQuizzes(quizzes);
      } catch (error) {
        console.error('Error loading scheduled quizzes:', error);
        setScheduledQuizzes([]);
      } finally {
        setLoadingScheduled(false);
      }
    };

    loadScheduledQuizzes();
    const interval = setInterval(loadScheduledQuizzes, 10000);
    return () => clearInterval(interval);
  }, []);

  // NEW: Real-time name validation
  useEffect(() => {
    const validateNameInRealTime = async () => {
      if (studentName.trim().length >= 2) {
        // For scheduled quizzes, validate against the first available quiz
        if (scheduledQuizzes.length > 0) {
          const firstQuiz = scheduledQuizzes.find(quiz => 
            quiz.status === 'scheduled' || quiz.status === 'activated'
          );
          if (firstQuiz) {
            const validation = await validateStudentName(firstQuiz);
            setNameValidation(validation);
          }
        }
      } else {
        setNameValidation({ valid: false, message: '' });
      }
    };

    const timeoutId = setTimeout(validateNameInRealTime, 500);
    return () => clearTimeout(timeoutId);
  }, [studentName, scheduledQuizzes]);

  // Handle quiz state transitions - ONLY for actual started quizzes
  useEffect(() => {
    if (!activeQuiz || !studentName.trim()) return;

    console.log('🔄 ACTIVE Quiz status:', activeQuiz.status);
    console.log('👤 Student in waiting room:', inWaitingRoom);

    // If student is in waiting room and quiz becomes active, start quiz immediately
    if (activeQuiz.status === 'active' && inWaitingRoom && !quizStarted) {
      console.log('🎬 Auto-starting quiz from waiting room');
      setQuizStarted(true);
      setInWaitingRoom(false);
    }

    // If quiz ends, reset everything
    if (activeQuiz.status === 'inactive') {
      console.log('🛑 Quiz ended');
      setQuizStarted(false);
      setInWaitingRoom(false);
    }
  }, [activeQuiz, studentName, inWaitingRoom, quizStarted]);

  // Enhanced quiz validation
  const validateQuizData = (quiz) => {
    if (!quiz) {
      console.error('No quiz data provided');
      return false;
    }

    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      console.error('Invalid or empty questions array');
      return false;
    }

    const hasValidQuestions = quiz.questions.every(q =>
      q &&
      typeof q === 'object' &&
      q.question &&
      q.options &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      q.correctAnswer
    );

    if (!hasValidQuestions) {
      console.error('Some questions are missing required fields');
      return false;
    }

    console.log('✅ Quiz validation passed - questions are valid');
    return true;
  };

  // NEW: Validate student name before joining any quiz
  const validateStudentName = async (quiz, nameToCheck = null) => {
    const name = nameToCheck || studentName.trim();
    
    if (!name) {
      return { valid: false, message: 'Please enter your name' };
    }

    // Basic validation
    if (name.length < 2) {
      return { valid: false, message: 'Name must be at least 2 characters long' };
    }

    if (name.length > 50) {
      return { valid: false, message: 'Name must be less than 50 characters' };
    }

    // Check for duplicate name
    try {
      const duplicateCheck = await checkDuplicateStudentName(quiz.id, name);
      
      if (duplicateCheck.exists) {
        return { 
          valid: false, 
          message: duplicateCheck.message 
        };
      }

      return { valid: true, message: 'Name is available' };
    } catch (error) {
      console.error('Error validating name:', error);
      return { valid: false, message: 'Error checking name availability' };
    }
  };

  // Verify passkey
  const verifyPasskey = (quiz, enteredPasskey) => {
    // If quiz has no passkey, allow access
    if (!quiz.passkey || quiz.passkey.trim() === '') {
      return true;
    }

    // Compare passkeys (case-sensitive)
    return quiz.passkey === enteredPasskey.trim();
  };

  // Handle passkey verification
  const handlePasskeyVerification = async () => {
    if (!selectedQuiz) return;

    try {
      const result = await verifyQuizPasskey(selectedQuiz.id, passkeyInput);
      
      if (!result.valid) {
        alert('❌ Incorrect passkey. Please try again.');
        setPasskeyInput('');
        return;
      }

      // Passkey is correct, proceed with joining
      await joinQuizWithPasskey(selectedQuiz);
    } catch (error) {
      console.error('Error verifying passkey:', error);
      alert('Error verifying passkey. Please try again.');
    }
  };

  // Join quiz after passkey verification
  const joinQuizWithPasskey = async (quiz) => {
    if (!studentName.trim()) {
      alert('Please enter your name first.');
      return;
    }

    // Validate quiz data before joining
    if (!validateQuizData(quiz)) {
      alert('This quiz has configuration issues. Please contact your instructor.');
      return;
    }

    setJoiningQuiz(quiz.id);
    try {
      localStorage.setItem('studentName', studentName.trim());

      if (quiz.status === 'activated' || quiz.status === 'scheduled') {
        // Join waiting room with passkey verification
        const result = await joinScheduledQuizWithPasskey(
          quiz.id, 
          studentName.trim(), 
          quiz.passkey ? passkeyInput : ''
        );
        
        if (result.success) {
          console.log('✅ Joined waiting room for scheduled quiz');
          setInWaitingRoom(true);
          setShowPasskeyModal(false);
          setPasskeyInput('');
          setSelectedQuiz(null);
        }
      }
    } catch (error) {
      console.error('Error joining scheduled quiz:', error);
      alert(`Error joining quiz: ${error.message}`);
    } finally {
      setJoiningQuiz(null);
    }
  };

  // UPDATED: Handle joining scheduled quiz with duplicate name check AND entry blocking
  const handleJoinScheduledQuiz = async (quiz) => {
    if (!studentName.trim()) {
      alert('Please enter your name first.');
      return;
    }

    // NEW: Check if any quiz is already active and block entry
    const activeQuizData = await getActiveQuizFromFirestore();
    if (activeQuizData && activeQuizData.status === 'active') {
      alert('❌ A quiz is currently in progress. Late entries are not allowed.');
      return;
    }

    // NEW: Validate name before proceeding
    const nameValidation = await validateStudentName(quiz);
    if (!nameValidation.valid) {
      alert(`❌ ${nameValidation.message}`);
      return;
    }

    // Check if quiz requires passkey
    if (quiz.passkey && quiz.passkey.trim() !== '') {
      // Show passkey modal
      setSelectedQuiz(quiz);
      setShowPasskeyModal(true);
      return;
    }

    // No passkey required, join directly
    await joinQuizWithPasskey(quiz);
  };

  // Handle quiz completion with consistent quiz ID
  const handleQuizComplete = async (score) => {
    console.log('🏁 Quiz Complete - Fixing result mismatch');

    const numericScore = Number(score) || 0;
    setFinalScore(numericScore);
    setQuizCompleted(true);
    setQuizStarted(false);

    try {
      if (activeQuiz && validateQuizData(activeQuiz)) {
        const totalQuestions = activeQuiz.questions?.length || 0;
        const percentage = totalQuestions > 0 ? Math.round((numericScore / totalQuestions) * 100) : 0;

        // Use consistent quiz ID (originalQuizId for scheduled quizzes)
        const quizIdToUse = activeQuiz.originalQuizId || activeQuiz.id;

        const result = {
          studentName: studentName.trim(),
          score: numericScore,
          totalQuestions: totalQuestions,
          percentage: percentage,
          quizId: quizIdToUse,
          quizName: activeQuiz.name,
          quizClass: activeQuiz.class,
          completedAt: Date.now(),
          joinTime: Date.now()
        };

        console.log('💾 Saving result with quiz ID:', quizIdToUse);
        await saveOrUpdateQuizResult(result);
      }
    } catch (error) {
      console.error('❌ Error saving result:', error);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizCompleted(false);
    setFinalScore(null);
  };

  // Check if quiz is ready to join
  const isQuizReadyToJoin = (quiz) => {
    const isScheduledOrActivated = quiz.status === 'scheduled' || quiz.status === 'activated';
    const isValidQuiz = validateQuizData(quiz);
    const isNotCompleted = quiz.status !== 'completed';

    return isScheduledOrActivated && isValidQuiz && isNotCompleted;
  };

  // Check if quiz is activated but waiting
  const isQuizActivated = (quiz) => {
    return quiz.status === 'activated';
  };

  // Get time display
  const getTimeDisplay = (quiz) => {
    if (quiz.status === 'activated') {
      return 'Waiting for admin to start';
    } else if (quiz.status === 'scheduled') {
      return `Scheduled for ${new Date(quiz.scheduledTime).toLocaleString()}`;
    }
    return 'Ready to join';
  };

  // Get quiz status for display
  const getQuizStatus = (quiz) => {
    if (isQuizActivated(quiz)) {
      return 'activated';
    } else if (isQuizReadyToJoin(quiz)) {
      return 'ready';
    } else {
      return 'upcoming';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Quiz Platform...</p>
      </div>
    );
  }

  // Render logic - ONLY use activeQuiz for actually started quizzes
  if (inWaitingRoom && activeQuiz) {
    return <WaitingRoom activeQuiz={activeQuiz} studentName={studentName} />;
  }

  if (quizCompleted && activeQuiz) {
    return (
      <CompleteResults
        score={finalScore}
        activeQuiz={activeQuiz}
        studentName={studentName}
        onRetake={handleRetakeQuiz}
      />
    );
  }

  if (quizStarted && activeQuiz) {
    return (
      <div className="quiz-container">
        <QuizInterface
          activeQuiz={activeQuiz}
          studentName={studentName}
          onQuizComplete={handleQuizComplete}
        />
      </div>
    );
  }

  // 🚨 REMOVED: The section that shows active quiz from context
  // This was the main bug - we were showing waiting room quizzes as "active"

  // Show portal with ONLY scheduled quizzes (from scheduledQuizzes array)
  return (
    <div className="student-portal">
      <div className="portal-container">
        <div className="portal-header">
          <div className="brand-section">
            <div className="brand-logo">🎯</div>
            <h1>EBI Quiz Platform</h1>
            <p>Professional Assessment System</p>
          </div>

          <div className="student-info-card">
            <h3>Student Information</h3>
            <input
              type="text"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className={`portal-input ${nameValidation.valid ? 'valid' : studentName.trim() ? 'invalid' : ''}`}
              maxLength={50}
            />
            
            {/* NEW: Real-time validation feedback */}
            {studentName.trim() && (
              <div className={`validation-message ${nameValidation.valid ? 'valid' : 'invalid'}`}>
                {nameValidation.valid ? (
                  <span className="valid-icon">✅</span>
                ) : (
                  <span className="invalid-icon">❌</span>
                )}
                {nameValidation.message || 'Enter your name to join quizzes'}
              </div>
            )}
          </div>
        </div>

        <div className="portal-content">
          {/* Quiz Portal Section */}
          <div className="upcoming-quizzes-section">
            <div className="section-header">
              <h2>📅 Quiz Portal</h2>
              <p>Join scheduled quizzes or active sessions</p>
            </div>

            {loadingScheduled ? (
              <div className="loading-upcoming">
                <div className="loading-spinner-small"></div>
                <p>Loading quizzes...</p>
              </div>
            ) : scheduledQuizzes.length > 0 ? (
              <div className="upcoming-quizzes-grid">
                {scheduledQuizzes.map((quiz) => {
                  const quizStatus = getQuizStatus(quiz);
                  const canJoin = (quizStatus === 'ready' || quizStatus === 'activated') && 
                                 studentName.trim() && 
                                 !joiningQuiz && 
                                 nameValidation.valid;
                  const isValidQuiz = validateQuizData(quiz);

                  return (
                    <div key={quiz.id} className="upcoming-quiz-card">
                      <div className="quiz-card-header">
                        <h4>{quiz.name}</h4>
                        <div className="badge-container">
                          <span className={`upcoming-badge ${quizStatus}`}>
                            {quizStatus === 'activated' ? 'WAITING FOR ADMIN' :
                              quizStatus === 'ready' ? 'READY TO JOIN' : 'SCHEDULED'}
                          </span>
                          {/* Passkey badge */}
                          {quiz.passkey && (
                            <span className="passkey-badge">🔑</span>
                          )}
                          {!isValidQuiz && (
                            <span className="error-badge">INVALID</span>
                          )}
                        </div>
                      </div>

                      <div className="quiz-card-details">
                        <div className="detail-item">
                          <span className="detail-icon">🏫</span>
                          <span>{quiz.class}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">📝</span>
                          <span>{quiz.questions?.length || 0} Questions</span>
                          {!isValidQuiz && (
                            <span style={{ color: '#dc3545', marginLeft: '5px' }}>⚠️</span>
                          )}
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">⏱️</span>
                          <span>{quiz.timePerQuestion}s per question</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">🕒</span>
                          <span className={`time-display ${quizStatus}`}>
                            {getTimeDisplay(quiz)}
                          </span>
                        </div>
                        {/* Passkey hint */}
                        {quiz.passkey && (
                          <div className="detail-item">
                            <span className="detail-icon">🔒</span>
                            <span style={{ color: '#ffc107', fontWeight: '600' }}>
                              Passkey Required
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="quiz-scheduled-time">
                        <strong>Originally Scheduled:</strong> {new Date(quiz.scheduledTime).toLocaleString()}
                      </div>

                      <div className="quiz-card-actions">
                        {(quizStatus === 'ready' || quizStatus === 'activated') ? (
                          <button
                            className={`btn-join ${canJoin && isValidQuiz ? 'enabled' : 'disabled'}`}
                            onClick={() => handleJoinScheduledQuiz(quiz)}
                            disabled={!canJoin || !isValidQuiz}
                            title={!isValidQuiz ? 'Quiz has configuration issues' : 
                                   !nameValidation.valid ? nameValidation.message : ''}
                          >
                            {joiningQuiz === quiz.id ? (
                              <>⏳ Joining...</>
                            ) : (
                              <>🚪 {quiz.passkey ? 'Enter Passkey' : 'Enter Waiting Room'}</>
                            )}
                          </button>
                        ) : (
                          <button className="btn-remind-me" disabled>
                            ⏰ Coming Soon
                          </button>
                        )}
                      </div>

                      {!studentName.trim() && (quizStatus === 'ready' || quizStatus === 'activated') && (
                        <div className="join-hint">
                          💡 Enter your name above to join
                        </div>
                      )}

                      {!nameValidation.valid && studentName.trim() && (quizStatus === 'ready' || quizStatus === 'activated') && (
                        <div className="error-message">
                          ❌ {nameValidation.message}
                        </div>
                      )}

                      {!isValidQuiz && (
                        <div className="error-message">
                          ⚠️ This quiz has configuration issues
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-upcoming-quizzes">
                <div className="empty-state-icon">📚</div>
                <h3>No Scheduled Quizzes</h3>
                <p>There are no scheduled quizzes at the moment. Check back later for new assessments.</p>
              </div>
            )}
          </div>

          <div className="info-grid">
            <div className="info-card">
              <div className="card-icon">⚡</div>
              <h4>Instant Access</h4>
              <p>Join assessments with your registered name</p>
            </div>
            <div className="info-card">
              <div className="card-icon">🛡️</div>
              <h4>Secure Environment</h4>
              <p>Protected testing environment</p>
            </div>
            <div className="info-card">
              <div className="card-icon">🔒</div>
              <h4>Duplicate Prevention</h4>
              <p>Unique names required for fair assessment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Passkey Modal */}
      {showPasskeyModal && selectedQuiz && (
        <div className="passkey-modal-overlay">
          <div className="passkey-modal">
            <div className="modal-header">
              <h3>🔑 Enter Passkey</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowPasskeyModal(false);
                  setSelectedQuiz(null);
                  setPasskeyInput('');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>This quiz requires a passkey to join:</p>
              <div className="quiz-info">
                <strong>{selectedQuiz.name}</strong>
                <span>Class: {selectedQuiz.class}</span>
              </div>
              <input
                type="text"
                placeholder="Enter passkey..."
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="passkey-input"
                autoFocus
              />
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowPasskeyModal(false);
                    setSelectedQuiz(null);
                    setPasskeyInput('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-join"
                  onClick={handlePasskeyVerification}
                  disabled={!passkeyInput.trim()}
                >
                  {joiningQuiz === selectedQuiz.id ? 'Verifying...' : 'Join Quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQuiz;