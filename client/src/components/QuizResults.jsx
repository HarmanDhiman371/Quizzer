import React from 'react';
import { getQuizResults } from '../utils/storage';

function QuizResults({ results, total, quizId }) {
  const allResults = getQuizResults().filter(r => r.quizId === quizId);
  
  const topStudents = allResults
    .map(result => ({
      ...result,
      speedScore: result.answers.reduce((total, answer) => total + (answer.timeTaken || 0), 0)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.speedScore - b.speedScore;
    })
    .slice(0, 5);

  const percentage = Math.round((results / total) * 100);
  const getGrade = (perc) => {
    if (perc >= 90) return { grade: 'A+', color: '#10b981' };
    if (perc >= 80) return { grade: 'A', color: '#34d399' };
    if (perc >= 70) return { grade: 'B', color: '#f59e0b' };
    if (perc >= 60) return { grade: 'C', color: '#f97316' };
    return { grade: 'F', color: '#ef4444' };
  };

  const gradeInfo = getGrade(percentage);

  return (
    <div className="quiz-results">
      <div className="results-container">
        <div className="results-header">
          <h1>EBI Quiz</h1>
          <h2>Quiz Completed!</h2>
        </div>

        <div className="score-display">
          <div className="score-circle" style={{ borderColor: gradeInfo.color }}>
            <span className="score-percentage" style={{ color: gradeInfo.color }}>
              {percentage}%
            </span>
            <span className="score-grade" style={{ color: gradeInfo.color }}>
              {gradeInfo.grade}
            </span>
          </div>
          <div className="score-details">
            <h3>Your Score</h3>
            <p>{results} out of {total} correct</p>
          </div>
        </div>

        <div className="top-performers-section">
          <h3>🏆 Top 5 Performers</h3>
          <div className="leaderboard">
            {topStudents.map((student, index) => (
              <div key={index} className={`leaderboard-item ${index === 0 ? 'first' : ''}`}>
                <div className="rank-medal">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </div>
                <div className="student-info">
                  <span className="student-name">{student.studentName}</span>
                  <span className="student-score">{student.score}/{student.totalQuestions}</span>
                </div>
                <div className="percentage">{student.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()} 
          className="home-btn"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default QuizResults;