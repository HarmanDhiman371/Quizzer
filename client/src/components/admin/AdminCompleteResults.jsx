import React, { useState, useEffect } from 'react';
import { getAllQuizResultsForAdmin } from '../../utils/firestore';

const AdminCompleteResults = ({ quiz }) => {
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // In AdminCompleteResults.jsx - Fix the data loading
useEffect(() => {
  const loadCompleteResults = async () => {
    if (!quiz?.id) return;
    
    try {
      console.log('👑 Loading complete results for admin, quiz:', quiz.id, quiz.quizName);
      
      // FIXED: Use the correct ID from classResults
      const quizIdToUse = quiz.quizId || quiz.id;
      const results = await getAllQuizResultsForAdmin(quizIdToUse);
      
      console.log(`👑 Admin found ${results.length} total participants`);
      setAllResults(results);
    } catch (error) {
      console.error('Error loading complete results:', error);
    } finally {
      setLoading(false);
    }
  };

  loadCompleteResults();
}, [quiz?.id, quiz?.quizId, quiz?.quizName]);

  if (loading) {
    return (
      <div className="admin-complete-results">
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading complete results...</p>
        </div>
      </div>
    );
  }

  const totalQuestions = quiz?.questions?.length || allResults[0]?.totalQuestions || 1;

  return (
    <div className="admin-complete-results">
      <div className="results-header">
        <h3>📊 Complete Results - {quiz?.name}</h3>
        <div className="results-stats">
          <span className="stat">Participants: {allResults.length}</span>
          <span className="stat">Questions: {totalQuestions}</span>
          <span className="stat">Class: {quiz?.class}</span>
        </div>
      </div>

      <div className="complete-rankings">
        {allResults.map((result, index) => {
          const resultTotalQuestions = result.totalQuestions || totalQuestions;
          const percentage = resultTotalQuestions > 0 ? 
            Math.round((result.score / resultTotalQuestions) * 100) : 0;
          
          return (
            <div key={result.id} className="ranking-row">
              <div className="rank-col">
                {index === 0 ? '🥇' : 
                 index === 1 ? '🥈' : 
                 index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              <div className="name-col">{result.studentName}</div>
              <div className="score-col">
                {result.score}/{resultTotalQuestions}
              </div>
              <div className="percentage-col">{percentage}%</div>
              <div className="tabs-col">
                {result.tabSwitches > 0 ? (
                  <span className="tab-warning">🔄 {result.tabSwitches}</span>
                ) : (
                  <span className="tab-ok">✅</span>
                )}
              </div>
              <div className="status-col">
                {result.completedAt ? '✅ Completed' : '❌ Incomplete'}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .admin-complete-results {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .results-header h3 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.4rem;
        }

        .results-stats {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .stat {
          background: #f8f9fa;
          padding: 8px 15px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #495057;
        }

        .complete-rankings {
          space-y: 8px;
        }

        .ranking-row {
          display: flex;
          align-items: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .ranking-row:hover {
          background: #e9ecef;
          transform: translateX(5px);
        }

        .rank-col {
          width: 60px;
          font-weight: bold;
          font-size: 1.1rem;
          text-align: center;
        }

        .name-col {
          flex: 1;
          font-weight: 500;
          color: #2c3e50;
        }

        .score-col {
          width: 100px;
          text-align: center;
          font-weight: 600;
          color: #495057;
        }

        .percentage-col {
          width: 80px;
          text-align: center;
          color: #28a745;
          font-weight: 600;
        }

        .tabs-col {
          width: 80px;
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

        .status-col {
          width: 120px;
          text-align: right;
          font-size: 0.8rem;
          color: #6c757d;
        }

        .loading-state {
          text-align: center;
          padding: 40px 20px;
        }

        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .results-header {
            flex-direction: column;
            align-items: stretch;
          }

          .results-stats {
            justify-content: center;
          }

          .ranking-row {
            flex-wrap: wrap;
            gap: 10px;
          }

          .rank-col, .score-col, .percentage-col, .tabs-col, .status-col {
            width: auto;
            flex: 1;
            text-align: center;
          }

          .name-col {
            flex-basis: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminCompleteResults;