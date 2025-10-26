import React, { useState, useEffect } from 'react';
import { getQuizResultsFromFirestore } from '../../utils/firestore';
import { useAlert } from '../../contexts/AlertContext';

const CompleteResults = ({ score, activeQuiz, studentName, onRetake }) => {
  const [allResults, setAllResults] = useState([]);
  const [userRank, setUserRank] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  // FIXED: Load results with proper filtering
  useEffect(() => {
    const loadCompleteResults = async () => {
      if (!activeQuiz?.id) {
        console.error('❌ No active quiz ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // FIXED: Use consistent quiz ID logic
        const quizIdToUse = activeQuiz.originalQuizId || activeQuiz.id;
        const totalQuestions = activeQuiz?.questions?.length || 1;
        
        console.log('🎯 Loading results for quiz:', {
          id: activeQuiz.id,
          originalId: activeQuiz.originalQuizId,
          usingId: quizIdToUse,
          name: activeQuiz.name
        });
        
        // FIXED: Get ALL results without filtering by quizName
        const results = await getQuizResultsFromFirestore(quizIdToUse);
        console.log('📊 Raw results from database:', results);
        
        // FIXED: Only filter by quizId, not quizName
        const currentQuizResults = results.filter(result => {
          const matchesId = result.quizId === quizIdToUse;
          console.log(`Result ${result.studentName}: quizId=${result.quizId}, matchesId=${matchesId}`);
          return matchesId; // Only check quizId, not quizName
        });

        console.log(`📊 Found ${currentQuizResults.length} results after filtering`);
        
        // FIXED: Add current student with proper data
        const userResultExists = currentQuizResults.some(result => 
          result.studentName === studentName
        );
        
        if (!userResultExists && score > 0) {
          console.log('👤 Adding current student to results');
          currentQuizResults.push({
            id: 'current-student',
            studentName: studentName,
            score: score,
            totalQuestions: totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            quizId: quizIdToUse,
            quizName: activeQuiz.name,
            completedAt: Date.now()
          });
        }

        // FIXED: Better sorting - score descending, then by completion time
        const sortedResults = currentQuizResults.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          // For same scores, earlier completion gets better rank
          return (a.completedAt || 0) - (b.completedAt || 0);
        });

        console.log('🏆 Final sorted results:', sortedResults.map(r => ({
          name: r.studentName,
          score: r.score,
          rank: sortedResults.indexOf(r) + 1
        })));

        setAllResults(sortedResults);
        
        // FIXED: Calculate rank properly
        const userIndex = sortedResults.findIndex(result => 
          result.studentName === studentName
        );
        
        const calculatedRank = userIndex !== -1 ? userIndex + 1 : sortedResults.length + 1;
        setUserRank(calculatedRank);
        
        console.log(`👤 User ${studentName} rank: ${calculatedRank} of ${sortedResults.length}`);
        
      } catch (error) {
        console.error('❌ Error loading results:', error);
        showAlert('Error loading results: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadCompleteResults();
  }, [activeQuiz?.id, activeQuiz?.originalQuizId, activeQuiz?.name, activeQuiz?.questions?.length, studentName, score, showAlert]);

  // FIXED: Use actual quiz questions for percentage
  const totalQuestions = activeQuiz?.questions?.length || 1;
  const percentage = Math.round((score / totalQuestions) * 100);

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
          <p className="quiz-info">Total Questions: {totalQuestions}</p>
          <p className="participants-count">{allResults.length} participants</p>
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
            {allResults.map((result, index) => {
              // FIXED: Use actual quiz questions for percentage
              const resultTotalQuestions = result.totalQuestions || totalQuestions;
              const resultPercentage = Math.round((result.score / resultTotalQuestions) * 100);

              return (
                <div
                  key={`${result.id}-${result.studentName}-${index}`}
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
                    <span className="percentage">{resultPercentage}%</span>
                  </div>
                  <div className="tab-info">
                    {result.tabSwitches > 0 ? (
                      <span className="tab-warning" title="Tab switches detected">
                        🔄 {result.tabSwitches}
                      </span>
                    ) : (
                      <span className="tab-ok">✅</span>
                    )}
                  </div>
                </div>
              );
            })}
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
          padding: 15px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .results-container {
          background: white;
          border-radius: 20px;
          padding: 25px 20px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }

        .results-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .trophy-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          animation: bounce 2s ease infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.05); }
        }

        .results-header h1 {
          color: #2c3e50;
          margin-bottom: 6px;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .results-header p {
          color: #6c757d;
          font-size: 1rem;
          margin: 4px 0;
        }

        .quiz-info {
          font-size: 0.85rem;
          color: #28a745;
          font-weight: 600;
        }

        .participants-count {
          text-align: center;
          color: #6c757d;
          margin-bottom: 15px;
          font-size: 0.85rem;
        }

        .personal-score-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px 20px;
          border-radius: 16px;
          margin-bottom: 25px;
          text-align: center;
        }

        .personal-score-card h3 {
          margin: 0 0 15px 0;
          font-size: 1.2rem;
        }

        .score-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .score-circle {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .score {
          font-size: 2.2rem;
          font-weight: 800;
        }

        .total {
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .score-details {
          text-align: center;
        }

        .percentage {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .rank {
          font-size: 1rem;
          opacity: 0.9;
        }

        .ranking-section {
          margin-bottom: 25px;
        }

        .ranking-section h3 {
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
          border-radius: 12px;
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ranking-item:hover {
          transform: translateX(3px);
          background: #e9ecef;
        }

        .ranking-item.current-user {
          background: linear-gradient(135deg, #e3f2fd, #bbdefb);
          border-left-color: #2196f3;
          font-weight: 600;
        }

        .rank-badge {
          width: 50px;
          font-weight: bold;
          font-size: 1rem;
          text-align: center;
          flex-shrink: 0;
        }

        .student-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 120px;
        }

        .name {
          color: #2c3e50;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .you-tag {
          background: #28a745;
          color: white;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .score-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .score-info .score {
          font-size: 0.9rem;
          font-weight: 600;
          color: #495057;
        }

        .score-info .percentage {
          font-size: 0.85rem;
          color: #28a745;
          font-weight: 600;
        }

        .tab-info {
          width: 50px;
          text-align: center;
          flex-shrink: 0;
        }

        .tab-warning {
          background: #fff3cd;
          color: #856404;
          padding: 3px 6px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .tab-ok {
          color: #28a745;
          font-size: 0.8rem;
        }

        .retake-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px 25px;
          border-radius: 20px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          margin-top: 15px;
        }

        .retake-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .loading-container {
          text-align: center;
          padding: 50px 15px;
          color: white;
        }

        .loader {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
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

        /* Mobile-specific styles */
        @media (max-width: 480px) {
          .complete-results {
            padding: 10px;
          }

          .results-container {
            padding: 20px 15px;
            border-radius: 16px;
          }

          .trophy-icon {
            font-size: 2.5rem;
          }

          .results-header h1 {
            font-size: 1.5rem;
          }

          .results-header p {
            font-size: 0.9rem;
          }

          .personal-score-card {
            padding: 20px 15px;
            border-radius: 14px;
          }

          .personal-score-card h3 {
            font-size: 1.1rem;
          }

          .score-display {
            flex-direction: column;
            gap: 12px;
          }

          .score {
            font-size: 1.8rem;
          }

          .total {
            font-size: 1rem;
          }

          .percentage {
            font-size: 1.3rem;
          }

          .rank {
            font-size: 0.9rem;
          }

          .ranking-item {
            padding: 10px 12px;
            gap: 6px;
          }

          .rank-badge {
            width: 40px;
            font-size: 0.9rem;
          }

          .student-info {
            min-width: 100px;
            order: 2;
            flex-basis: calc(100% - 100px);
          }

          .score-info {
            order: 3;
            margin-right: 0;
            flex-basis: 100%;
            justify-content: center;
            margin-top: 5px;
          }

          .tab-info {
            order: 4;
            width: auto;
          }

          .ranking-section h3 {
            font-size: 1.1rem;
          }

          .name {
            font-size: 0.9rem;
          }

          .score-info .score {
            font-size: 0.85rem;
          }

          .score-info .percentage {
            font-size: 0.8rem;
          }

          .retake-btn {
            padding: 12px 20px;
            font-size: 0.95rem;
          }
        }

        @media (max-width: 360px) {
          .results-container {
            padding: 15px 10px;
          }

          .ranking-item {
            padding: 8px 10px;
          }

          .student-info {
            min-width: 80px;
          }

          .rank-badge {
            width: 35px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CompleteResults;