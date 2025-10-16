// import React, { useState, useEffect } from 'react';
// import { useQuiz } from '../../contexts/QuizContext';
// import QuizInterface from './QuizInterface';
// import WaitingRoom from './WaitingRoom';
// import QuizResults from '../admin/QuizResults';
// import { saveOrUpdateQuizResult, getScheduledQuizzes, joinScheduledQuizWaitingRoom, isStudentInWaitingRoom } from '../../utils/firestore';

// const StudentQuiz = () => {
//   const { activeQuiz, loading } = useQuiz();
//   const [studentName, setStudentName] = useState(localStorage.getItem('studentName') || '');
//   const [joinTime, setJoinTime] = useState(Date.now());
//   const [quizStarted, setQuizStarted] = useState(false);
//   const [quizCompleted, setQuizCompleted] = useState(false);
//   const [finalScore, setFinalScore] = useState(null);
//   const [scheduledQuizzes, setScheduledQuizzes] = useState([]);
//   const [inWaitingRoom, setInWaitingRoom] = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [loadingScheduled, setLoadingScheduled] = useState(true);
//   const [joiningQuiz, setJoiningQuiz] = useState(null);
//   const [studentInWaitingRoom, setStudentInWaitingRoom] = useState(false);

//   // Fetch scheduled quizzes
//   useEffect(() => {
//     const loadScheduledQuizzes = async () => {
//       try {
//         setLoadingScheduled(true);
//         const quizzes = await getScheduledQuizzes();
//         setScheduledQuizzes(quizzes);
//       } catch (error) {
//         console.error('Error loading scheduled quizzes:', error);
//       } finally {
//         setLoadingScheduled(false);
//       }
//     };

//     loadScheduledQuizzes();
//     // Refresh every 10 seconds for better real-time updates
//     const interval = setInterval(loadScheduledQuizzes, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   // Check if student is already in waiting room
//   useEffect(() => {
//     const checkWaitingRoomStatus = async () => {
//       if (studentName.trim()) {
//         const inRoom = await isStudentInWaitingRoom(studentName);
//         setStudentInWaitingRoom(inRoom);
//       }
//     };

//     checkWaitingRoomStatus();
//     const interval = setInterval(checkWaitingRoomStatus, 5000);
//     return () => clearInterval(interval);
//   }, [studentName]);

//   // Enhanced fullscreen with proper error handling
//   const enterFullscreen = async () => {
//     try {
//       const element = document.documentElement;
      
//       if (element.requestFullscreen) {
//         await element.requestFullscreen();
//       } else if (element.webkitRequestFullscreen) {
//         await element.webkitRequestFullscreen();
//       } else if (element.mozRequestFullScreen) {
//         await element.mozRequestFullScreen();
//       } else if (element.msRequestFullscreen) {
//         await element.msRequestFullscreen();
//       }
      
//       setIsFullscreen(true);
//       document.body.classList.add('quiz-fullscreen');
      
//     } catch (error) {
//       console.log('Fullscreen not supported:', error);
//     }
//   };

//   const exitFullscreen = async () => {
//     try {
//       if (document.fullscreenElement || 
//           document.webkitFullscreenElement || 
//           document.mozFullScreenElement ||
//           document.msFullscreenElement) {
        
//         if (document.exitFullscreen) {
//           await document.exitFullscreen();
//         } else if (document.webkitExitFullscreen) {
//           await document.webkitExitFullscreen();
//         } else if (document.mozCancelFullScreen) {
//           await document.mozCancelFullScreen();
//         } else if (document.msExitFullscreen) {
//           await document.msExitFullscreen();
//         }
//       }
      
//       setIsFullscreen(false);
//       document.body.classList.remove('quiz-fullscreen');
      
//     } catch (error) {
//       console.log('Exit fullscreen error:', error);
//     }
//   };

//   // Validate quiz data function
//   const validateQuizData = (quiz) => {
//     if (!quiz) {
//       console.error('No quiz data provided');
//       return false;
//     }
    
//     if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
//       console.error('Invalid or empty questions array');
//       return false;
//     }
    
//     if (!quiz.quizDuration && !quiz.timePerQuestion) {
//       console.error('No time configuration found');
//       return false;
//     }
    
//     return true;
//   };

//   // Auto-manage quiz states with improved logic
//   useEffect(() => {
//     if (!activeQuiz || !studentName.trim()) return;

//     console.log('🔄 Quiz status changed:', activeQuiz.status);
//     console.log('🎯 Has Questions:', activeQuiz.questions?.length || 0);

//     // Validate quiz data before proceeding
//     if (!validateQuizData(activeQuiz)) {
//       console.error('Invalid quiz data, cannot proceed');
//       return;
//     }

//     // If student is in waiting room and quiz becomes active, start quiz
//     if (activeQuiz.status === 'active' && studentInWaitingRoom && !quizStarted) {
//       console.log('🎬 Starting quiz from waiting room');
//       setInWaitingRoom(false);
//       setQuizStarted(true);
//       enterFullscreen();
//     }
//     // If quiz ends while student is in it
//     else if (activeQuiz.status === 'inactive' && (quizStarted || inWaitingRoom)) {
//       console.log('🛑 Quiz ended by admin');
//       if (quizStarted) {
//         handleQuizComplete(finalScore || 0);
//       } else {
//         setInWaitingRoom(false);
//         setQuizStarted(false);
//         setStudentInWaitingRoom(false);
//         exitFullscreen();
//       }
//     }
//   }, [activeQuiz, studentName, quizStarted, inWaitingRoom, quizCompleted, studentInWaitingRoom]);

//   // Fullscreen change listener
//   useEffect(() => {
//     const handleFullscreenChange = () => {
//       const isFullscreen = !!(document.fullscreenElement || 
//                              document.webkitFullscreenElement || 
//                              document.mozFullScreenElement ||
//                              document.msFullscreenElement);
//       setIsFullscreen(isFullscreen);
//     };

//     document.addEventListener('fullscreenchange', handleFullscreenChange);
//     document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
//     document.addEventListener('mozfullscreenchange', handleFullscreenChange);
//     document.addEventListener('MSFullscreenChange', handleFullscreenChange);

//     return () => {
//       document.removeEventListener('fullscreenchange', handleFullscreenChange);
//       document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
//       document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
//       document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
//     };
//   }, []);

//   // Clean up fullscreen on unmount
//   useEffect(() => {
//     return () => {
//       exitFullscreen();
//     };
//   }, []);

//   const handleStartQuiz = () => {
//     if (!studentName.trim()) {
//       alert('Please enter your name to continue.');
//       return;
//     }
    
//     if (!activeQuiz) {
//       alert('No active quiz available.');
//       return;
//     }

//     // Validate quiz data before starting
//     if (!validateQuizData(activeQuiz)) {
//       alert('Quiz data is invalid. Please contact your instructor.');
//       return;
//     }

//     // Save student name to localStorage
//     localStorage.setItem('studentName', studentName.trim());
//     setJoinTime(Date.now());

//     if (activeQuiz.status === 'waiting') {
//       console.log('🚶‍♂️ Joining waiting room');
//       setInWaitingRoom(true);
//     } else if (activeQuiz.status === 'active') {
//       console.log('🎬 Starting quiz immediately');
//       setQuizStarted(true);
//       enterFullscreen();
//     }
//   };

//   // NEW: Handle joining scheduled quiz
//   const handleJoinScheduledQuiz = async (quiz) => {
//     if (!studentName.trim()) {
//       alert('Please enter your name first.');
//       return;
//     }

//     if (studentInWaitingRoom) {
//       alert('You are already in a waiting room for another quiz.');
//       return;
//     }

//     setJoiningQuiz(quiz.id);
//     try {
//       // Save student name to localStorage
//       localStorage.setItem('studentName', studentName.trim());
      
//       const result = await joinScheduledQuizWaitingRoom(quiz.id, studentName.trim());
      
//       if (result.success) {
//         console.log('✅ Joined scheduled quiz waiting room');
//         setInWaitingRoom(true);
//         setStudentInWaitingRoom(true);
//       }
//     } catch (error) {
//       console.error('Error joining scheduled quiz:', error);
//       alert('Error joining quiz. Please try again.');
//     } finally {
//       setJoiningQuiz(null);
//     }
//   };

//   const handleQuizStarting = () => {
//     console.log('🎬 Quiz starting from waiting room');
//     setInWaitingRoom(false);
//     setQuizStarted(true);
//     enterFullscreen();
//   };

//   const handleQuizComplete = async (score) => {
//     console.log('🏁 Quiz Complete - Final Score:', score);
    
//     // Ensure score is a number
//     const numericScore = Number(score) || 0;
    
//     // Update state first
//     setFinalScore(numericScore);
//     setQuizCompleted(true);
//     setQuizStarted(false);
//     setInWaitingRoom(false);
//     setStudentInWaitingRoom(false);
    
//     try {
//       if (activeQuiz && validateQuizData(activeQuiz)) {
//         const totalQuestions = activeQuiz.questions?.length || 0;
//         const percentage = totalQuestions > 0 ? Math.round((numericScore / totalQuestions) * 100) : 0;
        
//         const result = {
//           studentName: studentName.trim(),
//           score: numericScore,
//           totalQuestions: totalQuestions,
//           percentage: percentage,
//           accuracy: percentage,
//           quizId: activeQuiz.id,
//           quizName: activeQuiz.name,
//           joinTime: joinTime,
//           completedAt: Date.now()
//         };

//         console.log('💾 Saving final result:', result);
//         await saveOrUpdateQuizResult(result);
//         console.log('✅ Results saved successfully');
//       } else {
//         console.error('Cannot save results: Invalid quiz data');
//       }
//     } catch (error) {
//       console.error('❌ Error saving result:', error);
//     } finally {
//       // Always exit fullscreen
//       await exitFullscreen();
//     }
//   };

//   const handleRetakeQuiz = () => {
//     console.log('🔄 Retaking quiz');
//     setQuizCompleted(false);
//     setFinalScore(null);
//     setInWaitingRoom(false);
//     setQuizStarted(false);
//     setStudentInWaitingRoom(false);
//   };

//   // Format time until quiz starts
//   const getTimeUntilQuiz = (scheduledTime) => {
//     const now = Date.now();
//     const timeDiff = scheduledTime - now;
    
//     if (timeDiff <= 0) return 'Ready to join!';
    
//     const hours = Math.floor(timeDiff / (1000 * 60 * 60));
//     const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
//     if (hours > 0) {
//       return `in ${hours}h ${minutes}m`;
//     } else if (minutes > 0) {
//       return `in ${minutes}m`;
//     } else {
//       return 'in less than a minute';
//     }
//   };

//   // Check if quiz is ready to join (scheduled time passed)
//   const isQuizReadyToJoin = (quiz) => {
//     return Date.now() >= quiz.scheduledTime;
//   };

//   // Check if student can join quiz
//   const canJoinQuiz = (quiz) => {
//     return studentName.trim() && 
//            !studentInWaitingRoom && 
//            isQuizReadyToJoin(quiz) &&
//            !joiningQuiz;
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading Quiz Platform...</p>
//       </div>
//     );
//   }

//   // Render appropriate component based on state
//   if (inWaitingRoom && activeQuiz) {
//     return <WaitingRoom activeQuiz={activeQuiz} studentName={studentName} onQuizStarting={handleQuizStarting} />;
//   }

//   if (quizCompleted && activeQuiz) {
//     return (
//       <QuizResults 
//         score={finalScore} 
//         activeQuiz={activeQuiz} 
//         studentName={studentName} 
//         onRetake={handleRetakeQuiz} 
//       />
//     );
//   }

//   if (quizStarted && activeQuiz && validateQuizData(activeQuiz)) {
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

//   // Show active quiz lobby
//   if (activeQuiz && (activeQuiz.status === 'active' || activeQuiz.status === 'waiting')) {
//     const totalQuestions = activeQuiz.questions?.length || 0;
//     const hasValidQuestions = totalQuestions > 0;

//     return (
//       <div className="quiz-lobby">
//         <div className="lobby-card">
//           <div className="quiz-brand">
//             <div className="brand-icon">🎯</div>
//             <h1>EBI Quiz Platform</h1>
//           </div>

//           <div className="quiz-header">
//             <h2>{activeQuiz.name}</h2>
//             <span className={`status-badge ${activeQuiz.status}`}>
//               {activeQuiz.status === 'waiting' ? 'STARTING SOON' : 'LIVE NOW'}
//             </span>
//           </div>
          
//           <div className="quiz-meta-grid">
//             <div className="meta-item">
//               <span className="meta-icon">🏫</span>
//               <div className="meta-content">
//                 <span className="label">Class</span>
//                 <span className="value">{activeQuiz.class}</span>
//               </div>
//             </div>
//             <div className="meta-item">
//               <span className="meta-icon">📝</span>
//               <div className="meta-content">
//                 <span className="label">Questions</span>
//                 <span className="value">
//                   {hasValidQuestions ? totalQuestions : 'N/A'}
//                   {!hasValidQuestions && <span style={{color: '#dc3545', fontSize: '0.8em'}}> (Invalid)</span>}
//                 </span>
//               </div>
//             </div>
//             <div className="meta-item">
//               <span className="meta-icon">⏱️</span>
//               <div className="meta-content">
//                 <span className="label">Time</span>
//                 <span className="value">
//                   {activeQuiz.quizDuration ? `${activeQuiz.quizDuration}m` : 
//                    activeQuiz.timePerQuestion ? `${activeQuiz.timePerQuestion}s/q` : 'N/A'}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {!hasValidQuestions && (
//             <div className="warning-banner">
//               ⚠️ This quiz has configuration issues. Please contact your instructor.
//             </div>
//           )}

//           <div className="join-section">
//             <div className="input-group">
//               <input
//                 type="text"
//                 placeholder="Enter your full name"
//                 value={studentName}
//                 onChange={(e) => setStudentName(e.target.value)}
//                 className="name-input"
//                 maxLength={50}
//               />
//             </div>
//             <button 
//               onClick={handleStartQuiz}
//               disabled={!studentName.trim() || !hasValidQuestions}
//               className="start-btn"
//             >
//               {activeQuiz.status === 'waiting' ? 'Join Waiting Room' : 'Start Assessment'}
//             </button>
//           </div>

//           {activeQuiz.status === 'waiting' && activeQuiz.quizStartTime && (
//             <div className="countdown-info">
//               <div className="countdown-text">
//                 Starts in: {Math.max(0, Math.ceil((activeQuiz.quizStartTime - Date.now()) / 1000))}s
//               </div>
//             </div>
//           )}

//           <div className="quiz-instructions">
//             <h4>Instructions:</h4>
//             <ul>
//               <li>Ensure you have a stable internet connection</li>
//               <li>The quiz will open in fullscreen mode</li>
//               <li>Do not refresh the page during the quiz</li>
//               <li>Answer all questions before time runs out</li>
//             </ul>
//           </div>
//         </div>

//         <style jsx>{`
//           .quiz-lobby {
//             min-height: 100vh;
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             padding: 20px;
//           }

//           .lobby-card {
//             background: rgba(255, 255, 255, 0.95);
//             backdrop-filter: blur(20px);
//             border-radius: 24px;
//             padding: 50px 40px;
//             box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
//             max-width: 500px;
//             width: 100%;
//             animation: slideUp 0.6s ease-out;
//             border: 1px solid rgba(255, 255, 255, 0.2);
//           }

//           @keyframes slideUp {
//             from {
//               opacity: 0;
//               transform: translateY(30px);
//             }
//             to {
//               opacity: 1;
//               transform: translateY(0);
//             }
//           }

//           .quiz-brand {
//             text-align: center;
//             margin-bottom: 40px;
//           }

//           .brand-icon {
//             font-size: 3rem;
//             margin-bottom: 15px;
//           }

//           .quiz-brand h1 {
//             color: #2c3e50;
//             margin: 0;
//             font-size: 1.8rem;
//             font-weight: 700;
//           }

//           .quiz-header {
//             text-align: center;
//             margin-bottom: 40px;
//           }

//           .quiz-header h2 {
//             color: #2c3e50;
//             margin-bottom: 15px;
//             font-size: 2rem;
//             font-weight: 700;
//           }

//           .status-badge {
//             padding: 10px 20px;
//             border-radius: 25px;
//             font-size: 0.85rem;
//             font-weight: 700;
//             text-transform: uppercase;
//             letter-spacing: 0.5px;
//           }

//           .status-badge.waiting {
//             background: linear-gradient(135deg, #ffd700, #ffed4e);
//             color: #856404;
//           }

//           .status-badge.active {
//             background: linear-gradient(135deg, #28a745, #20c997);
//             color: white;
//           }

//           .quiz-meta-grid {
//             display: grid;
//             gap: 20px;
//             margin-bottom: 30px;
//           }

//           .meta-item {
//             display: flex;
//             align-items: center;
//             gap: 15px;
//             padding: 20px;
//             background: rgba(102, 126, 234, 0.1);
//             border-radius: 16px;
//             border: 1px solid rgba(102, 126, 234, 0.2);
//           }

//           .meta-icon {
//             font-size: 1.5rem;
//           }

//           .meta-content {
//             flex: 1;
//           }

//           .label {
//             display: block;
//             color: #6c757d;
//             font-size: 0.85rem;
//             margin-bottom: 4px;
//             font-weight: 600;
//           }

//           .value {
//             display: block;
//             color: #2c3e50;
//             font-weight: 700;
//             font-size: 1.1rem;
//           }

//           .warning-banner {
//             background: linear-gradient(135deg, #ffc107, #ffca28);
//             color: #856404;
//             padding: 15px;
//             border-radius: 12px;
//             margin-bottom: 20px;
//             text-align: center;
//             font-weight: 600;
//             border: 1px solid #ffeaa7;
//           }

//           .join-section {
//             display: flex;
//             flex-direction: column;
//             gap: 20px;
//             margin-bottom: 30px;
//           }

//           .input-group {
//             position: relative;
//           }

//           .name-input {
//             width: 100%;
//             padding: 18px 20px;
//             border: 2px solid #e9ecef;
//             border-radius: 12px;
//             font-size: 1rem;
//             transition: all 0.3s ease;
//             background: white;
//           }

//           .name-input:focus {
//             outline: none;
//             border-color: #667eea;
//             box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
//           }

//           .start-btn {
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             color: white;
//             border: none;
//             padding: 18px;
//             border-radius: 12px;
//             font-size: 1.1rem;
//             font-weight: 700;
//             cursor: pointer;
//             transition: all 0.3s ease;
//             position: relative;
//             overflow: hidden;
//           }

//           .start-btn:hover:not(:disabled) {
//             transform: translateY(-2px);
//             box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
//           }

//           .start-btn:disabled {
//             opacity: 0.6;
//             cursor: not-allowed;
//             transform: none;
//             background: #6c757d;
//           }

//           .countdown-info {
//             text-align: center;
//             margin-bottom: 20px;
//             padding: 15px;
//             background: rgba(255, 193, 7, 0.1);
//             border-radius: 12px;
//             border: 1px solid rgba(255, 193, 7, 0.3);
//           }

//           .countdown-text {
//             color: #856404;
//             font-weight: 600;
//             font-size: 1rem;
//           }

//           .quiz-instructions {
//             background: rgba(108, 117, 125, 0.1);
//             padding: 20px;
//             border-radius: 12px;
//             border: 1px solid rgba(108, 117, 125, 0.2);
//           }

//           .quiz-instructions h4 {
//             color: #2c3e50;
//             margin-bottom: 15px;
//             font-size: 1.1rem;
//           }

//           .quiz-instructions ul {
//             color: #6c757d;
//             padding-left: 20px;
//             margin: 0;
//           }

//           .quiz-instructions li {
//             margin-bottom: 8px;
//             line-height: 1.4;
//           }

//           .loading-container {
//             min-height: 100vh;
//             display: flex;
//             flex-direction: column;
//             align-items: center;
//             justify-content: center;
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             color: white;
//           }

//           .loading-spinner {
//             width: 50px;
//             height: 50px;
//             border: 4px solid rgba(255, 255, 255, 0.3);
//             border-top: 4px solid white;
//             border-radius: 50%;
//             animation: spin 1s linear infinite;
//             margin-bottom: 20px;
//           }

//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }

//           @media (max-width: 768px) {
//             .lobby-card {
//               padding: 40px 25px;
//               margin: 20px;
//             }

//             .quiz-brand h1 {
//               font-size: 1.5rem;
//             }

//             .quiz-header h2 {
//               font-size: 1.6rem;
//             }
//           }
//         `}</style>
//       </div>
//     );
//   }

//   // No active quiz - show portal with upcoming quizzes
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
//                 {studentInWaitingRoom && (
//                   <div className="waiting-room-status">
//                     🚪 You are in a waiting room
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="portal-content">
//           {/* Upcoming Quizzes Section */}
//           <div className="upcoming-quizzes-section">
//             <div className="section-header">
//               <h2>📅 Upcoming Quizzes</h2>
//               <p>Get ready for these scheduled assessments</p>
//             </div>

//             {loadingScheduled ? (
//               <div className="loading-upcoming">
//                 <div className="loading-spinner-small"></div>
//                 <p>Loading upcoming quizzes...</p>
//               </div>
//             ) : scheduledQuizzes.length > 0 ? (
//               <div className="upcoming-quizzes-grid">
//                 {scheduledQuizzes.map((quiz) => {
//                   const readyToJoin = isQuizReadyToJoin(quiz);
//                   const canJoin = canJoinQuiz(quiz);
                  
//                   return (
//                     <div key={quiz.id} className="upcoming-quiz-card">
//                       <div className="quiz-card-header">
//                         <h4>{quiz.name}</h4>
//                         <span className={`upcoming-badge ${readyToJoin ? 'ready' : 'upcoming'}`}>
//                           {readyToJoin ? 'READY TO JOIN' : 'UPCOMING'}
//                         </span>
//                       </div>
                      
//                       <div className="quiz-card-details">
//                         <div className="detail-item">
//                           <span className="detail-icon">🏫</span>
//                           <span>{quiz.class}</span>
//                         </div>
//                         <div className="detail-item">
//                           <span className="detail-icon">📝</span>
//                           <span>{quiz.questions?.length || 0} Questions</span>
//                         </div>
//                         <div className="detail-item">
//                           <span className="detail-icon">⏱️</span>
//                           <span>{quiz.timePerQuestion}s per question</span>
//                         </div>
//                         <div className="detail-item">
//                           <span className="detail-icon">🕒</span>
//                           <span className={`start-time ${readyToJoin ? 'ready' : ''}`}>
//                             {readyToJoin ? 'Ready to join!' : `Starts ${getTimeUntilQuiz(quiz.scheduledTime)}`}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="quiz-scheduled-time">
//                         <strong>Schedule:</strong> {new Date(quiz.scheduledTime).toLocaleString()}
//                       </div>

//                       <div className="quiz-card-actions">
//                         {readyToJoin ? (
//                           <button 
//                             className={`btn-join ${canJoin ? 'enabled' : 'disabled'}`}
//                             onClick={() => handleJoinScheduledQuiz(quiz)}
//                             disabled={!canJoin}
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

//                       {!studentName.trim() && readyToJoin && (
//                         <div className="join-hint">
//                           💡 Enter your name above to join
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             ) : (
//               <div className="no-upcoming-quizzes">
//                 <div className="empty-state-icon">📚</div>
//                 <h3>No Upcoming Quizzes</h3>
//                 <p>There are no scheduled quizzes at the moment. Check back later for new assessments.</p>
//               </div>
//             )}
//           </div>

//           <div className="info-grid">
//             <div className="info-card">
//               <div className="card-icon">⚡</div>
//               <h4>Instant Access</h4>
//               <p>Join active assessments immediately with your registered name</p>
//             </div>
//             <div className="info-card">
//               <div className="card-icon">🛡️</div>
//               <h4>Secure Environment</h4>
//               <p>Protected testing environment with anti-cheat measures</p>
//             </div>
//             <div className="info-card">
//               <div className="card-icon">📊</div>
//               <h4>Real-time Results</h4>
//               <p>Immediate performance feedback and detailed analytics</p>
//             </div>
//           </div>

//           {!activeQuiz && (
//             <div className="no-quiz-message">
//               <div className="message-icon">📚</div>
//               <h3>No Active Quiz</h3>
//               <p>There are no active quizzes at the moment. Please check back later or contact your instructor.</p>
//             </div>
//           )}
//         </div>
//       </div>

      // <style jsx>{`
        
      // `}</style>
//     </div>
//   );
// };

// export default StudentQuiz;
import React, { useState, useEffect } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import QuizInterface from './QuizInterface';
import WaitingRoom from './WaitingRoom';
import QuizResults from '../admin/QuizResults';
import { saveOrUpdateQuizResult, getAllScheduledQuizzes, joinScheduledQuizWaitingRoom } from '../../utils/firestore';

const StudentQuiz = () => {
  const { activeQuiz, loading } = useQuiz();
  const [studentName, setStudentName] = useState(localStorage.getItem('studentName') || '');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [scheduledQuizzes, setScheduledQuizzes] = useState([]);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [joiningQuiz, setJoiningQuiz] = useState(null);

  // FIXED: Fetch ALL scheduled quizzes (including activated ones)
  useEffect(() => {
    const loadScheduledQuizzes = async () => {
      try {
        setLoadingScheduled(true);
        const quizzes = await getAllScheduledQuizzes();
        setScheduledQuizzes(quizzes);
      } catch (error) {
        console.error('Error loading scheduled quizzes:', error);
        setScheduledQuizzes([]); // Ensure empty array on error
      } finally {
        setLoadingScheduled(false);
      }
    };

    loadScheduledQuizzes();
    const interval = setInterval(loadScheduledQuizzes, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // FIXED: Handle quiz state transitions
  useEffect(() => {
    if (!activeQuiz || !studentName.trim()) return;

    console.log('🔄 Quiz status:', activeQuiz.status);
    console.log('👤 Student in waiting room:', inWaitingRoom);

    // If student is in waiting room and quiz becomes active, start quiz immediately
    if (activeQuiz.status === 'active' && inWaitingRoom && !quizStarted) {
      console.log('🎬 Auto-starting quiz from waiting room');
      setQuizStarted(true);
      setInWaitingRoom(false);
      enterFullscreen();
    }
    
    // If quiz ends, reset everything
    if (activeQuiz.status === 'inactive') {
      console.log('🛑 Quiz ended');
      setQuizStarted(false);
      setInWaitingRoom(false);
      exitFullscreen();
    }
  }, [activeQuiz, studentName, inWaitingRoom, quizStarted]);

  // Fullscreen functions
  const enterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.log('Fullscreen not supported:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.log('Exit fullscreen error:', error);
    }
  };

  // FIXED: Enhanced quiz validation
 const validateQuizData = (quiz) => {
  if (!quiz) {
    console.error('No quiz data provided');
    return false;
  }
  
  // SIMPLE check - just verify questions array exists and has items
  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    console.error('Invalid or empty questions array');
    return false;
  }
  
  // Basic check that questions have the required fields
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

  // FIXED: Handle joining scheduled quiz
  const handleJoinScheduledQuiz = async (quiz) => {
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
      
      const result = await joinScheduledQuizWaitingRoom(quiz.id, studentName.trim());
      
      if (result.success) {
        console.log('✅ Joined waiting room for scheduled quiz');
        setInWaitingRoom(true);
      }
    } catch (error) {
      console.error('Error joining scheduled quiz:', error);
      alert(`Error joining quiz: ${error.message}`);
    } finally {
      setJoiningQuiz(null);
    }
  };

  const handleQuizComplete = async (score) => {
    console.log('🏁 Quiz Complete');
    
    const numericScore = Number(score) || 0;
    setFinalScore(numericScore);
    setQuizCompleted(true);
    setQuizStarted(false);
    
    try {
      if (activeQuiz && validateQuizData(activeQuiz)) {
        const totalQuestions = activeQuiz.questions?.length || 0;
        const percentage = totalQuestions > 0 ? Math.round((numericScore / totalQuestions) * 100) : 0;
        
        const result = {
          studentName: studentName.trim(),
          score: numericScore,
          totalQuestions: totalQuestions,
          percentage: percentage,
          quizId: activeQuiz.id,
          quizName: activeQuiz.name,
          completedAt: Date.now()
        };

        await saveOrUpdateQuizResult(result);
      }
    } catch (error) {
      console.error('❌ Error saving result:', error);
    } finally {
      await exitFullscreen();
    }
  };

  const handleRetakeQuiz = () => {
    setQuizCompleted(false);
    setFinalScore(null);
  };

  // FIXED: Check if quiz is ready to join
  const isQuizReadyToJoin = (quiz) => {
    const now = Date.now();
    const scheduledTimePassed = now >= quiz.scheduledTime;
    const noActiveQuiz = !activeQuiz || activeQuiz.status === 'inactive';
    const quizNotActivated = quiz.status === 'scheduled';
    
    return scheduledTimePassed && noActiveQuiz && quizNotActivated && validateQuizData(quiz);
  };

  // FIXED: Check if quiz is activated but waiting
  const isQuizActivated = (quiz) => {
    return quiz.status === 'activated';
  };

  // Format time display
  const getTimeUntilQuiz = (scheduledTime) => {
    const now = Date.now();
    const timeDiff = scheduledTime - now;
    
    if (timeDiff <= 0) return 'Ready to join!';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `in ${minutes}m`;
    } else {
      return 'in less than a minute';
    }
  };

  // FIXED: Get quiz status for display
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

  // FIXED: Render logic
  if (inWaitingRoom && activeQuiz) {
    return <WaitingRoom activeQuiz={activeQuiz} studentName={studentName} />;
  }

  if (quizCompleted && activeQuiz) {
    return (
      <QuizResults 
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

  // Show active quiz lobby (only for non-scheduled quizzes)
  if (activeQuiz && activeQuiz.status === 'active' && !activeQuiz.isFromScheduled) {
    return (
      <div className="quiz-lobby">
        {/* ... (keep your existing active quiz lobby code) ... */}
      </div>
    );
  }

  // FIXED: Show portal with ALL scheduled quizzes - they NEVER disappear
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
              className="portal-input"
              maxLength={50}
            />
            {studentName.trim() && (
              <div className="welcome-message">
                Welcome, <strong>{studentName}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="portal-content">
          {/* Quiz Portal Section - ALWAYS VISIBLE */}
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
                  const canJoin = quizStatus === 'ready' && studentName.trim() && !joiningQuiz;
                  const isValidQuiz = validateQuizData(quiz);
                  
                  return (
                    <div key={quiz.id} className="upcoming-quiz-card">
                      <div className="quiz-card-header">
                        <h4>{quiz.name}</h4>
                        <span className={`upcoming-badge ${quizStatus}`}>
                          {quizStatus === 'activated' ? 'ACTIVATED' : 
                           quizStatus === 'ready' ? 'READY TO JOIN' : 'UPCOMING'}
                        </span>
                        {!isValidQuiz && (
                          <span className="error-badge">INVALID</span>
                        )}
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
                            <span style={{color: '#dc3545', marginLeft: '5px'}}>⚠️</span>
                          )}
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">⏱️</span>
                          <span>{quiz.timePerQuestion}s per question</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">🕒</span>
                          <span className={`start-time ${quizStatus}`}>
                            {quizStatus === 'activated' ? 'Waiting for admin to start' :
                             quizStatus === 'ready' ? 'Join waiting room' : 
                             `Starts ${getTimeUntilQuiz(quiz.scheduledTime)}`}
                          </span>
                        </div>
                      </div>

                      <div className="quiz-scheduled-time">
                        <strong>Schedule:</strong> {new Date(quiz.scheduledTime).toLocaleString()}
                      </div>

                      <div className="quiz-card-actions">
                        {quizStatus === 'ready' ? (
                          <button 
                            className={`btn-join ${canJoin && isValidQuiz ? 'enabled' : 'disabled'}`}
                            onClick={() => handleJoinScheduledQuiz(quiz)}
                            disabled={!canJoin || !isValidQuiz}
                            title={!isValidQuiz ? 'Quiz has configuration issues' : ''}
                          >
                            {joiningQuiz === quiz.id ? (
                              <>⏳ Joining...</>
                            ) : (
                              <>🚪 Enter Waiting Room</>
                            )}
                          </button>
                        ) : quizStatus === 'activated' ? (
                          <button className="btn-activated" disabled>
                            ⏳ Waiting for Admin
                          </button>
                        ) : (
                          <button className="btn-remind-me" disabled>
                            ⏰ Coming Soon
                          </button>
                        )}
                      </div>

                      {!studentName.trim() && quizStatus === 'ready' && (
                        <div className="join-hint">
                          💡 Enter your name above to join
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

          {/* Show active quiz info if there is one */}
          {activeQuiz && activeQuiz.status === 'active' && (
            <div className="active-quiz-notice">
              <div className="notice-icon">🎯</div>
              <h3>Active Quiz Running</h3>
              <p>There's an active quiz running. Check the quiz lobby to join.</p>
            </div>
          )}

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
              <div className="card-icon">📊</div>
              <h4>Real-time Results</h4>
              <p>Immediate performance feedback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add new CSS styles */}
      <style jsx>{`
        .active-quiz-notice {
          background: rgba(40, 167, 69, 0.1);
          border: 2px solid #28a745;
          border-radius: 15px;
          padding: 25px;
          text-align: center;
          margin: 30px 0;
          backdrop-filter: blur(10px);
        }

        .notice-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .active-quiz-notice h3 {
          color: #28a745;
          margin-bottom: 10px;
          font-size: 1.4rem;
        }

        .active-quiz-notice p {
          color: #155724;
          margin: 0;
          font-size: 1rem;
        }

        .error-badge {
          background: #dc3545;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
          margin-left: 8px;
        }

        .error-message {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          padding: 10px;
          border-radius: 8px;
          text-align: center;
          font-size: 0.9rem;
          margin-top: 10px;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }

        .btn-activated {
          width: 100%;
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          color: #856404;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 0.9rem;
          cursor: not-allowed;
        }

        .start-time.activated {
          color: #ffc107;
          font-weight: 600;
        }

        /* ... (keep all your existing CSS) ... */
        .student-portal {
          min-height: 100vh;
          background: linear-gradient(135deg, #023e8a 0%, #0077b6 100%);
          padding: 40px 20px;
        }

        .portal-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .portal-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .brand-section {
          margin-bottom: 40px;
        }

        .brand-logo {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .brand-section h1 {
          color: white;
          font-size: 3rem;
          margin-bottom: 10px;
          font-weight: 800;
        }

        .brand-section p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.2rem;
          margin: 0;
        }

        .student-info-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 30px;
          border-radius: 20px;
          max-width: 400px;
          margin: 0 auto;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }

        .student-info-card h3 {
          color: #2c3e50;
          margin-bottom: 20px;
          text-align: center;
        }

        .portal-input {
          
          padding: 15px 20px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 1rem;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }

        .portal-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .welcome-message {
          text-align: center;
          color: #28a745;
          font-weight: 600;
        }

        .waiting-room-status {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(255, 193, 7, 0.2);
          border-radius: 8px;
          font-size: 0.9rem;
          color: #856404;
        }

        .portal-content {
          margin-top: 40px;
        }

        /* Upcoming Quizzes Styles */
        .upcoming-quizzes-section {
          margin-bottom: 60px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-header h2 {
          color: white;
          font-size: 2.5rem;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .section-header p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.1rem;
          margin: 0;
        }

        .loading-upcoming {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .loading-spinner-small {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        .upcoming-quizzes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .upcoming-quiz-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .upcoming-quiz-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .quiz-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .quiz-card-header h4 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.3rem;
          font-weight: 700;
          flex: 1;
          margin-right: 15px;
        }

        .upcoming-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .upcoming-badge.upcoming {
          background: linear-gradient(135deg, #ff6b6b, #ee5a52);
          color: white;
        }

        .upcoming-badge.ready {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
        }

        .quiz-card-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #5a6c7d;
          font-size: 0.95rem;
        }

        .detail-icon {
          font-size: 1.1rem;
          width: 20px;
          text-align: center;
        }

        .start-time {
          color: #6c757d;
          font-weight: 600;
        }

        .start-time.ready {
          color: #28a745;
          font-weight: 700;
        }

        .quiz-scheduled-time {
          background: rgba(255, 193, 7, 0.1);
          padding: 12px 15px;
          border-radius: 12px;
          border: 1px solid rgba(255, 193, 7, 0.3);
          color: #856404;
          font-size: 0.9rem;
          margin-bottom: 20px;
          text-align: center;
        }

        .quiz-card-actions {
          text-align: center;
          margin-bottom: 10px;
        }

        .btn-join {
          width: 100%;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-join.enabled {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
        }

        .btn-join.enabled:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(40, 167, 69, 0.3);
        }

        .btn-join.disabled {
          background: #6c757d;
          color: white;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-remind-me {
          width: 100%;
          background: rgba(108, 117, 125, 0.1);
          border: 1px solid rgba(108, 117, 125, 0.3);
          color: #6c757d;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 0.9rem;
          cursor: not-allowed;
          transition: all 0.3s ease;
        }

        .join-hint {
          text-align: center;
          color: #17a2b8;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 8px;
          background: rgba(23, 162, 184, 0.1);
          border-radius: 8px;
        }

        .no-upcoming-quizzes {
          text-align: center;
          padding: 60px 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          opacity: 0.7;
        }

        .no-upcoming-quizzes h3 {
          color: white;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }

        .no-upcoming-quizzes p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.6;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          max-width: 1000px;
          margin: 0 auto 40px;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 30px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .info-card:hover {
          transform: translateY(-5px);
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .info-card h4 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1.3rem;
        }

        .info-card p {
          color: #6c757d;
          line-height: 1.6;
          margin: 0;
        }

        .no-quiz-message {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }

        .message-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .no-quiz-message h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }

        .no-quiz-message p {
          color: #6c757d;
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 768px) {
          .brand-section h1 {
            font-size: 2.2rem;
          }

          .section-header h2 {
            font-size: 2rem;
          }

          .upcoming-quizzes-grid {
            grid-template-columns: 1fr;
          }

          .student-info-card {
            margin: 0 20px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .no-quiz-message {
            margin: 0 20px;
            padding: 30px 20px;
          }

          .quiz-card-header {
            flex-direction: column;
            gap: 10px;
          }

          .quiz-card-header h4 {
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentQuiz;