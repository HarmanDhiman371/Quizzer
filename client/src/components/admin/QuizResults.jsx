import React, { useState, useEffect } from 'react';
import { getQuizResultsFromFirestore } from '../../utils/firestore';

const QuizResults = ({ score, activeQuiz, studentName, onRetake }) => {
  const [allResults, setAllResults] = useState([]);
  const [userRank, setUserRank] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topRankings, setTopRankings] = useState([]);

  // Calculate user rank from all participants
  useEffect(() => {
    const calculateRank = async () => {
      if (!activeQuiz?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get all results for this quiz
        const results = await getQuizResultsFromFirestore(activeQuiz.id);
        setAllResults(results);

        // Sort results by score (descending) and time (ascending for tie-breaker)
        const sortedResults = results.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // If scores are equal, earlier completion gets better rank
          return (a.completedAt || 0) - (b.completedAt || 0);
        });

        // Find user's rank
        const userIndex = sortedResults.findIndex(result => 
          result.studentName === studentName
        );
        
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        }

        // Get top 5 rankings
        const totalQuestions = activeQuiz.questions?.length || 0;
        const top5 = sortedResults.slice(0, 5).map((result, index) => ({
          ...result,
          rank: index + 1,
          percentage: totalQuestions > 0 ? Math.round((result.score / totalQuestions) * 100) : 0
        }));
        
        setTopRankings(top5);

      } catch (error) {
        console.error('Error calculating rank:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateRank();
  }, [activeQuiz?.id, studentName, activeQuiz?.questions?.length]);

  // Safe handling of undefined activeQuiz with proper fallback
  const totalQuestions = activeQuiz?.questions?.length || 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  
  const getPerformanceMessage = () => {
    if (totalQuestions === 0) return "Assessment Complete! 📝";
    if (percentage >= 90) return "Outstanding Performance! 🎉";
    if (percentage >= 75) return "Excellent Work! 👍";
    if (percentage >= 60) return "Good Job! 😊";
    if (percentage >= 40) return "Well Done! 👏";
    return "Keep Practicing! 💪";
  };

  const getRankBadge = () => {
    if (userRank === 1) return "🥇 Gold Rank";
    if (userRank === 2) return "🥈 Silver Rank";
    if (userRank === 3) return "🥉 Bronze Rank";
    if (userRank <= 10) return `🏅 Top 10 (#${userRank})`;
    return `#${userRank} Rank`;
  };

  const getRankIcon = () => {
    if (userRank === 1) return "🥇";
    if (userRank === 2) return "🥈";
    if (userRank === 3) return "🥉";
    if (userRank <= 10) return "🏅";
    return "📊";
  };

  // If no active quiz data, show simplified results
  if (!activeQuiz || !activeQuiz.questions) {
    return (
      <div className="quiz-results">
        <div className="results-container">
          <div className="results-header">
            <div className="trophy-icon">🏆</div>
            <h1>Assessment Complete</h1>
            <p>Great work, {studentName}!</p>
          </div>

          <div className="score-display">
            <div className="score-circle">
              <div className="score-value">{score}</div>
              <div className="score-total">/ {totalQuestions > 0 ? totalQuestions : '?'}</div>
            </div>
            {totalQuestions > 0 ? (
              <>
                <div className="percentage">{percentage}%</div>
                <div className="performance-message">{getPerformanceMessage()}</div>
              </>
            ) : (
              <div className="performance-message">Score: {score}</div>
            )}
            {!loading && userRank > 0 && (
              <div className="rank-badge">
                {getRankIcon()} {getRankBadge()}
              </div>
            )}
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Your Score</span>
              <span className="stat-value">{score}</span>
            </div>
            {totalQuestions > 0 && (
              <div className="stat-item">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">{percentage}%</span>
              </div>
            )}
            {!loading && userRank > 0 && (
              <div className="stat-item">
                <span className="stat-label">Rank</span>
                <span className="stat-value">#{userRank} of {allResults.length}</span>
              </div>
            )}
          </div>

          {/* Top 5 Rankings Section */}
          {!loading && topRankings.length > 0 && (
            <div className="top-rankings-section">
              <h3>🏆 Top 5 Performers</h3>
              <div className="rankings-list">
                {topRankings.map((result, index) => (
                  <div key={result.id || index} className={`ranking-item ${result.studentName === studentName ? 'current-user' : ''}`}>
                    <span className="rank-position">
                      {result.rank === 1 ? '🥇' : 
                       result.rank === 2 ? '🥈' : 
                       result.rank === 3 ? '🥉' : `#${result.rank}`}
                    </span>
                    <span className="student-name">
                      {result.studentName}
                      {result.studentName === studentName && ' (You)'}
                    </span>
                    <span className="ranking-score">
                      {result.score}/{totalQuestions > 0 ? totalQuestions : '?'}
                    </span>
                    {totalQuestions > 0 && (
                      <span className="ranking-percentage">
                        {result.percentage}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={onRetake} className="retake-btn">
            Return to Dashboard
          </button>
        </div>

        <style jsx>{`
          .quiz-results {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: 'Inter', 'Segoe UI', sans-serif;
          }

          .results-container {
            background: white;
            border-radius: 24px;
            padding: 40px 30px;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            max-width: 500px;
            width: 100%;
            animation: slideUp 0.6s ease-out;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .results-header {
            margin-bottom: 30px;
          }

          .trophy-icon {
            font-size: 3.5rem;
            margin-bottom: 15px;
            animation: bounce 2s ease infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-8px) scale(1.05); }
          }

          .results-header h1 {
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 2rem;
            font-weight: 700;
          }

          .results-header p {
            color: #6c757d;
            font-size: 1.1rem;
            margin: 0;
          }

          .score-display {
            margin: 30px 0;
          }

          .score-circle {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            margin: 0 auto 20px;
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
          }

          .score-value {
            font-size: 2.8rem;
            font-weight: 800;
            line-height: 1;
          }

          .score-total {
            font-size: 1rem;
            opacity: 0.9;
          }

          .percentage {
            font-size: 1.8rem;
            font-weight: 800;
            color: #2c3e50;
            margin-bottom: 8px;
          }

          .performance-message {
            font-size: 1.2rem;
            color: #667eea;
            font-weight: 700;
            margin-bottom: 12px;
          }

          .rank-badge {
            display: inline-block;
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #856404;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.85rem;
            margin-top: 8px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: ${totalQuestions > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'};
            gap: 12px;
            margin: 25px 0;
          }

          .stat-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
          }

          .stat-label {
            display: block;
            color: #6c757d;
            font-size: 0.75rem;
            margin-bottom: 6px;
            font-weight: 600;
          }

          .stat-value {
            display: block;
            color: #2c3e50;
            font-weight: 700;
            font-size: 1.1rem;
          }

          .top-rankings-section {
            margin: 25px 0;
            text-align: left;
          }

          .top-rankings-section h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            text-align: center;
            font-size: 1.2rem;
          }

          .rankings-list {
            space-y: 8px;
          }

          .ranking-item {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 8px;
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
          }

          .ranking-item.current-user {
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            border-left-color: #2196f3;
            font-weight: 600;
          }

          .ranking-item:hover {
            transform: translateX(5px);
            background: #e9ecef;
          }

          .rank-position {
            width: 40px;
            font-weight: bold;
            font-size: 0.9rem;
            text-align: center;
            color: #2c3e50;
          }

          .student-name {
            flex: 1;
            color: #2c3e50;
            font-size: 0.9rem;
            padding: 0 10px;
          }

          .ranking-score {
            width: 70px;
            text-align: center;
            font-weight: 600;
            color: #495057;
            font-size: 0.85rem;
          }

          .ranking-percentage {
            width: 50px;
            text-align: center;
            color: #28a745;
            font-weight: 600;
            font-size: 0.85rem;
          }

          .retake-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 30px;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            margin-top: 20px;
          }

          .retake-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
          }

          @media (max-width: 480px) {
            .results-container {
              padding: 30px 20px;
              margin: 10px;
            }

            .trophy-icon {
              font-size: 3rem;
            }

            .results-header h1 {
              font-size: 1.7rem;
            }

            .score-circle {
              width: 120px;
              height: 120px;
            }

            .score-value {
              font-size: 2.3rem;
            }

            .stats-grid {
              grid-template-columns: 1fr;
              gap: 8px;
            }

            .ranking-item {
              padding: 10px 12px;
              font-size: 0.85rem;
            }

            .rank-position {
              width: 35px;
              font-size: 0.8rem;
            }

            .ranking-score {
              width: 60px;
              font-size: 0.8rem;
            }

            .ranking-percentage {
              width: 45px;
              font-size: 0.8rem;
            }
          }

          @media (max-width: 380px) {
            .results-container {
              padding: 25px 15px;
            }

            .ranking-item {
              flex-wrap: wrap;
              gap: 5px;
            }

            .student-name {
              min-width: 120px;
              order: 2;
              flex-basis: 100%;
              text-align: center;
              padding: 5px 0 0 0;
            }

            .rank-position {
              order: 1;
            }

            .ranking-score {
              order: 3;
            }

            .ranking-percentage {
              order: 4;
            }
          }
        `}</style>
      </div>
    );
  }

  // Show full results when activeQuiz data is available
  return (
    <div className="quiz-results">
      <div className="results-container">
        <div className="results-header">
          <div className="trophy-icon">🏆</div>
          <h1>Assessment Complete</h1>
          <p>Excellent effort, {studentName}!</p>
        </div>

        <div className="score-display">
          <div className="score-circle">
            <div className="score-value">{score}</div>
            <div className="score-total">/ {activeQuiz.questions.length}</div>
          </div>
          <div className="percentage">{percentage}%</div>
          <div className="performance-message">{getPerformanceMessage()}</div>
          {!loading && userRank > 0 && (
            <div className="rank-badge">
              {getRankIcon()} {getRankBadge()}
            </div>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Your Score</span>
            <span className="stat-value">{score}/{activeQuiz.questions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{percentage}%</span>
          </div>
          {!loading && userRank > 0 && (
            <div className="stat-item">
              <span className="stat-label">Rank</span>
              <span className="stat-value">#{userRank} of {allResults.length}</span>
            </div>
          )}
        </div>

        {/* Top 5 Rankings Section */}
        {!loading && topRankings.length > 0 && (
          <div className="top-rankings-section">
            <h3>🏆 Top 5 Performers</h3>
            <div className="rankings-list">
              {topRankings.map((result, index) => (
                <div key={result.id || index} className={`ranking-item ${result.studentName === studentName ? 'current-user' : ''}`}>
                  <span className="rank-position">
                    {result.rank === 1 ? '🥇' : 
                     result.rank === 2 ? '🥈' : 
                     result.rank === 3 ? '🥉' : `#${result.rank}`}
                  </span>
                  <span className="student-name">
                    {result.studentName}
                    {result.studentName === studentName && ' (You)'}
                  </span>
                  <span className="ranking-score">
                    {result.score}/{activeQuiz.questions.length}
                  </span>
                  <span className="ranking-percentage">
                    {result.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="quiz-info-card">
          <h3>{activeQuiz.name}</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Class</span>
              <span className="value">{activeQuiz.class}</span>
            </div>
            <div className="info-item">
              <span className="label">Duration</span>
              <span className="value">{Math.ceil((activeQuiz.questions.length * activeQuiz.timePerQuestion) / 60)} min</span>
            </div>
            <div className="info-item">
              <span className="label">Participants</span>
              <span className="value">{allResults.length}</span>
            </div>
          </div>
        </div>

        {!loading && userRank > 0 && userRank <= 3 && (
          <div className="achievement-banner">
            <div className="achievement-icon">{getRankIcon()}</div>
            <div className="achievement-text">
              <h4>Top Performer!</h4>
              <p>You ranked #{userRank} out of {allResults.length} participants</p>
            </div>
          </div>
        )}

        <button onClick={onRetake} className="retake-btn">
          Return to Dashboard
        </button>
      </div>

      <style jsx>{`
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 15px;
        }

        .info-item {
          text-align: center;
        }

        .label {
          display: block;
          color: #6c757d;
          font-size: 0.8rem;
          margin-bottom: 5px;
          font-weight: 600;
        }

        .value {
          display: block;
          color: #2c3e50;
          font-weight: 700;
          font-size: 1rem;
        }

        .quiz-info-card {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 16px;
          margin: 30px 0;
        }

        .quiz-info-card h3 {
          color: #2c3e50;
          margin-bottom: 20px;
          text-align: center;
          font-size: 1.4rem;
        }

        .achievement-banner {
          background: linear-gradient(135deg, #fff3cd, #ffeaa7);
          border: 2px solid #ffd700;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          margin: 20px 0;
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
          to { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
        }

        .achievement-icon {
          font-size: 2.5rem;
        }

        .achievement-text h4 {
          color: #856404;
          margin: 0 0 5px 0;
          font-size: 1.2rem;
        }

        .achievement-text p {
          color: #856404;
          margin: 0;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .achievement-banner {
            flex-direction: column;
            text-align: center;
          }

          .quiz-info-card {
            padding: 20px;
            margin: 20px 0;
          }
        }

        @media (max-width: 480px) {
          .quiz-info-card {
            padding: 15px;
          }

          .quiz-info-card h3 {
            font-size: 1.2rem;
            margin-bottom: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizResults;