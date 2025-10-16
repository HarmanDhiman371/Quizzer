// import React, { useState, useEffect } from 'react';
// import { getQuizResults, getOverallTopStudents } from '../utils/storage';

// function QuizResults({ results, total, quizId, missedQuestions }) {
//   const [allResults, setAllResults] = useState([]);
//   const [topStudents, setTopStudents] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadResults();
//   }, [quizId]);

//   const loadResults = async () => {
//     try {
//       setLoading(true);
      
//       // Load results for this specific quiz
//       const quizResults = await getQuizResults(quizId);
//       setAllResults(quizResults || []);
      
//       // Load top students
//       const top = await getOverallTopStudents(5);
//       setTopStudents(top || []);
      
//       setLoading(false);
//     } catch (error) {
//       console.error('Error loading results:', error);
//       setAllResults([]);
//       setTopStudents([]);
//       setLoading(false);
//     }
//   };

//   const percentage = Math.round((results / total) * 100);
//   const getGrade = (perc) => {
//     if (perc >= 90) return { grade: 'A+', color: '#10b981' };
//     if (perc >= 80) return { grade: 'A', color: '#34d399' };
//     if (perc >= 70) return { grade: 'B', color: '#f59e0b' };
//     if (perc >= 60) return { grade: 'C', color: '#f97316' };
//     return { grade: 'F', color: '#ef4444' };
//   };

//   const gradeInfo = getGrade(percentage);

//   if (loading) {
//     return (
//       <div className="quiz-results">
//         <div className="results-container">
//           <div className="loading-state">
//             <div className="loader"></div>
//             <h3>Loading Results...</h3>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="quiz-results">
//       <div className="results-container">
//         <div className="results-header">
//           <h1>EBI Quiz</h1>
//           <h2>Quiz Completed!</h2>
//         </div>

//         <div className="score-display">
//           <div className="score-circle" style={{ borderColor: gradeInfo.color }}>
//             <span className="score-percentage" style={{ color: gradeInfo.color }}>
//               {percentage}%
//             </span>
//             <span className="score-grade" style={{ color: gradeInfo.color }}>
//               {gradeInfo.grade}
//             </span>
//           </div>
//           <div className="score-details">
//             <h3>Your Score</h3>
//             <p>{results} out of {total} correct</p>
//             {missedQuestions > 0 && (
//               <p className="missed-info">{missedQuestions} questions missed (joined late)</p>
//             )}
//           </div>
//         </div>

//         <div className="top-performers-section">
//           <h3>🏆 Top 5 Performers</h3>
//           <div className="leaderboard">
//             {topStudents.length > 0 ? (
//               topStudents.map((student, index) => (
//                 <div key={index} className={`leaderboard-item ${index === 0 ? 'first' : ''}`}>
//                   <div className="rank-medal">
//                     {index === 0 && '🥇'}
//                     {index === 1 && '🥈'}
//                     {index === 2 && '🥉'}
//                     {index > 2 && `#${index + 1}`}
//                   </div>
//                   <div className="student-info">
//                     <span className="student-name">{student.name}</span>
//                     <span className="student-score">
//                       {student.averagePercentage || 0}% average • {student.totalQuizzes || 0} quizzes
//                     </span>
//                   </div>
//                   <div className="percentage">{student.averagePercentage || 0}%</div>
//                 </div>
//               ))
//             ) : (
//               <div className="no-results">
//                 <p>No top performers data available</p>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="your-performance">
//           <h3>📊 Your Performance</h3>
//           <div className="performance-stats">
//             <div className="stat">
//               <span>Your Score</span>
//               <strong>{results}/{total}</strong>
//             </div>
//             <div className="stat">
//               <span>Percentage</span>
//               <strong>{percentage}%</strong>
//             </div>
//             <div className="stat">
//               <span>Grade</span>
//               <strong style={{ color: gradeInfo.color }}>{gradeInfo.grade}</strong>
//             </div>
//             {missedQuestions > 0 && (
//               <div className="stat">
//                 <span>Missed Questions</span>
//                 <strong>{missedQuestions}</strong>
//               </div>
//             )}
//           </div>
//         </div>

//         <button 
//           onClick={() => window.location.reload()} 
//           className="home-btn"
//         >
//           Back to Home
//         </button>
//       </div>
//     </div>
//   );
// }

// export default QuizResults;