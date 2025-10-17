import React, { useState, useEffect } from 'react';
import { getQuizResultsFromFirestore } from '../../utils/firestore';

const CompleteResults = ({ score, activeQuiz, studentName, onRetake }) => {
  const [allResults, setAllResults] = useState([]);
  const [userRank, setUserRank] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      if (!activeQuiz?.id) return;
      
      try {
        const results = await getQuizResultsFromFirestore(activeQuiz.id);
        
        // Sort by score descending, then by completion time ascending
        const sortedResults = results.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (a.completedAt || 0) - (b.completedAt || 0);
        });
        
        setAllResults(sortedResults);
        
        // Find user rank
        const userIndex = sortedResults.findIndex(result => 
          result.studentName === studentName
        );
        setUserRank(userIndex + 1);
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [activeQuiz?.id, studentName]);

  const totalQuestions = activeQuiz?.questions?.length || 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  if (loading) {
    return (
      <div className="complete-results">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="complete-results">
      <div className="results-container">
        <div className="results-header">
          <div className="trophy-icon">🏆</div>
          <h1>Quiz Results</h1>
          <p>Class: {activeQuiz?.class} • {activeQuiz?.name}</p>
        </div>

        {/* Personal Score Card */}
        <div className="personal-score-card">
          <h3>Your Performance</h3>
          <div className="score-display">
            <div className="score-circle">
              <span className="score">{score}</span>
              <span className="total">/{totalQuestions}</span>
            </div>
            <div className="score-details">
              <div className="percentage">{percentage}%</div>
              <div className="rank">Rank: #{userRank} of {allResults.length}</div>
            </div>
          </div>
        </div>

        {/* Complete Ranking List */}
        <div className="ranking-section">
          <h3>📊 Complete Class Rankings</h3>
          <div className="rankings-list">
            {allResults.map((result, index) => (
              <div 
                key={result.id} 
                className={`ranking-item ${result.studentName === studentName ? 'current-user' : ''}`}
              >
                <div className="rank-badge">
                  {index === 0 ? '🥇' : 
                   index === 1 ? '🥈' : 
                   index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                <div className="student-info">
                  <span className="name">{result.studentName}</span>
                  {result.studentName === studentName && <span className="you-tag">(You)</span>}
                </div>
                <div className="score-info">
                  <span className="score">{result.score}/{totalQuestions}</span>
                  <span className="percentage">{Math.round((result.score / totalQuestions) * 100)}%</span>
                </div>
                <div className="tab-info">
                  {result.tabSwitches > 0 ? (
                    <span className="tab-warning" title="Tab switches detected">🔄 {result.tabSwitches}</span>
                  ) : (
                    <span className="tab-ok">✅</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onRetake} className="retake-btn">
          Return to Dashboard
        </button>
      </div>

      <style jsx>{`
        .complete-results {
          min-height: 100vh;
          background: linear-gradient(135deg, #023e8a 0%, #03045e 100%);
          padding: 20px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .results-container {
          background: white;
          border-radius: 24px;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }

        .results-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .trophy-icon {
          font-size: 4rem;
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
          font-size: 2.5rem;
          font-weight: 700;
        }

        .results-header p {
          color: #6c757d;
          font-size: 1.1rem;
          margin: 0;
        }

        .personal-score-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 20px;
          margin-bottom: 30px;
          text-align: center;
        }

        .personal-score-card h3 {
          margin: 0 0 20px 0;
          font-size: 1.4rem;
        }

        .score-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
        }

        .score-circle {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .score {
          font-size: 3rem;
          font-weight: 800;
        }

        .total {
          font-size: 1.5rem;
          opacity: 0.9;
        }

        .score-details {
          text-align: left;
        }

        .percentage {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .rank {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .ranking-section {
          margin-bottom: 30px;
        }

        .ranking-section h3 {
          color: #2c3e50;
          margin-bottom: 20px;
          text-align: center;
          font-size: 1.4rem;
        }

        .rankings-list {
          space-y: 10px;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          background: #f8f9fa;
          border-radius: 12px;
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
        }

        .ranking-item:hover {
          transform: translateX(5px);
          background: #e9ecef;
        }

        .ranking-item.current-user {
          background: linear-gradient(135deg, #e3f2fd, #bbdefb);
          border-left-color: #2196f3;
          font-weight: 600;
        }

        .rank-badge {
          width: 60px;
          font-weight: bold;
          font-size: 1.1rem;
          text-align: center;
        }

        .student-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .name {
          color: #2c3e50;
          font-weight: 500;
        }

        .you-tag {
          background: #28a745;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .score-info {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-right: 15px;
        }

        .score-info .score {
          font-size: 1rem;
          font-weight: 600;
          color: #495057;
        }

        .score-info .percentage {
          font-size: 0.9rem;
          color: #28a745;
          font-weight: 600;
        }

        .tab-info {
          width: 60px;
          text-align: center;
        }

        .tab-warning {
          background: #fff3cd;
          color: #856404;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .tab-ok {
          color: #28a745;
        }

        .retake-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .retake-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .loading-container {
          text-align: center;
          padding: 60px 20px;
          color: white;
        }

        .loader {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .results-container {
            padding: 30px 20px;
            margin: 10px;
          }

          .score-display {
            flex-direction: column;
            gap: 15px;
          }

          .score-details {
            text-align: center;
          }

          .ranking-item {
            flex-wrap: wrap;
            gap: 10px;
          }

          .student-info {
            order: 2;
            flex-basis: 100%;
            justify-content: center;
          }

          .score-info {
            order: 3;
            margin-right: 0;
          }

          .tab-info {
            order: 4;
          }
        }
      `}</style>
    </div>
  );
};

export default CompleteResults;