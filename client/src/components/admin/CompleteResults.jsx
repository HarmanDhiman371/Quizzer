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
          name: activeQuiz.name,
          totalQuestions: totalQuestions
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
          padding: 12px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .results-container {
          background: white;
          border-radius: 20px;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .results-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .trophy-icon {
          font-size: 2.8rem;
          margin-bottom: 10px;
          animation: bounce 2s ease infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }

        .results-header h1 {
          color: #2c3e50;
          margin-bottom: 5px;
          font-size: 1.7rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .results-header p {
          color: #6c757d;
          font-size: 0.95rem;
          margin: 3px 0;
          line-height: 1.3;
        }

        .quiz-info {
          font-size: 0.8rem;
          color: #28a745;
          font-weight: 600;
        }

        .participants-count {
          text-align: center;
          color: #6c757d;
          margin-bottom: 12px;
          font-size: 0.8rem;
        }

        .personal-score-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 15px;
          border-radius: 16px;
          margin-bottom: 20px;
          text-align: center;
        }

        .personal-score-card h3 {
          margin: 0 0 12px 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .score-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .score-circle {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }

        .score {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
        }

        .total {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .score-details {
          text-align: center;
        }

        .percentage {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 3px;
          line-height: 1;
        }

        .rank {
          font-size: 0.9rem;
          opacity: 0.9;
          line-height: 1.2;
        }

        .ranking-section {
          margin-bottom: 20px;
        }

        .ranking-section h3 {
          color: #2c3e50;
          margin-bottom: 12px;
          text-align: center;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .rankings-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          background: #f8f9fa;
          border-radius: 10px;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          gap: 8px;
        }

        .ranking-item:hover {
          transform: translateX(2px);
          background: #e9ecef;
        }

        .ranking-item.current-user {
          background: linear-gradient(135deg, #e3f2fd, #bbdefb);
          border-left-color: #2196f3;
          font-weight: 600;
        }

        .rank-badge {
          width: 40px;
          font-weight: bold;
          font-size: 0.9rem;
          text-align: center;
          flex-shrink: 0;
        }

        .student-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          overflow: hidden;
        }

        .name {
          color: #2c3e50;
          font-weight: 500;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .you-tag {
          background: #28a745;
          color: white;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 0.6rem;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .score-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          margin-left: auto;
        }

        .score-info .score {
          font-size: 0.85rem;
          font-weight: 600;
          color: #495057;
          white-space: nowrap;
        }

        .score-info .percentage {
          font-size: 0.8rem;
          color: #28a745;
          font-weight: 600;
          white-space: nowrap;
        }

        .tab-info {
          flex-shrink: 0;
          margin-left: 4px;
        }

        .tab-warning {
          background: #fff3cd;
          color: #856404;
          padding: 2px 5px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .tab-ok {
          color: #28a745;
          font-size: 0.75rem;
        }

        .retake-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
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
          padding: 40px 15px;
          color: white;
        }

        .loader {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 35px;
          height: 35px;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Desktop and Tablet Styles */
        @media (min-width: 769px) {
          .results-container {
            padding: 25px;
          }

          .trophy-icon {
            font-size: 3rem;
          }

          .results-header h1 {
            font-size: 1.8rem;
          }

          .personal-score-card {
            padding: 25px 20px;
          }

          .score {
            font-size: 2.2rem;
          }

          .ranking-item {
            padding: 12px 15px;
          }
        }

        /* Enhanced Mobile-specific styles */
        @media (max-width: 480px) {
          .complete-results {
            padding: 8px;
          }

          .results-container {
            padding: 16px 12px;
            border-radius: 16px;
          }

          .trophy-icon {
            font-size: 2.2rem;
            margin-bottom: 8px;
          }

          .results-header h1 {
            font-size: 1.4rem;
            margin-bottom: 4px;
          }

          .results-header p {
            font-size: 0.85rem;
            margin: 2px 0;
          }

          .personal-score-card {
            padding: 16px 12px;
            border-radius: 12px;
            margin-bottom: 16px;
          }

          .personal-score-card h3 {
            font-size: 1rem;
            margin-bottom: 10px;
          }

          .score-display {
            flex-direction: column;
            gap: 10px;
          }

          .score-circle {
            gap: 2px;
          }

          .score {
            font-size: 1.6rem;
          }

          .total {
            font-size: 0.95rem;
          }

          .percentage {
            font-size: 1.1rem;
            margin-bottom: 2px;
          }

          .rank {
            font-size: 0.85rem;
          }

          .ranking-section {
            margin-bottom: 16px;
          }

          .ranking-section h3 {
            font-size: 1rem;
            margin-bottom: 10px;
          }

          .rankings-list {
            gap: 5px;
          }

          .ranking-item {
            padding: 8px 10px;
            gap: 6px;
            min-height: 44px;
          }

          .rank-badge {
            width: 35px;
            font-size: 0.85rem;
          }

          .student-info {
            gap: 4px;
            min-width: 0;
          }

          .name {
            font-size: 0.85rem;
            flex: 1;
            min-width: 0;
          }

          .you-tag {
            font-size: 0.55rem;
            padding: 1px 4px;
          }

          .score-info {
            gap: 6px;
            margin-left: auto;
          }

          .score-info .score {
            font-size: 0.8rem;
          }

          .score-info .percentage {
            font-size: 0.75rem;
          }

          .tab-info {
            margin-left: 2px;
          }

          .tab-warning {
            font-size: 0.65rem;
            padding: 1px 4px;
          }

          .tab-ok {
            font-size: 0.7rem;
          }

          .retake-btn {
            padding: 12px 16px;
            font-size: 0.9rem;
            border-radius: 10px;
            margin-top: 12px;
          }
        }

        @media (max-width: 360px) {
          .results-container {
            padding: 14px 10px;
            border-radius: 14px;
          }

          .ranking-item {
            padding: 7px 8px;
            gap: 5px;
            min-height: 42px;
          }

          .rank-badge {
            width: 30px;
            font-size: 0.8rem;
          }

          .name {
            font-size: 0.8rem;
          }

          .score-info .score {
            font-size: 0.75rem;
          }

          .score-info .percentage {
            font-size: 0.7rem;
          }

          .results-header h1 {
            font-size: 1.3rem;
          }

          .trophy-icon {
            font-size: 2rem;
          }
        }

        /* Extra small devices */
        @media (max-width: 320px) {
          .complete-results {
            padding: 6px;
          }

          .results-container {
            padding: 12px 8px;
          }

          .ranking-item {
            padding: 6px;
            gap: 4px;
          }

          .rank-badge {
            width: 28px;
            font-size: 0.75rem;
          }

          .student-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }

          .name {
            font-size: 0.78rem;
          }

          .score-info {
            flex-direction: column;
            gap: 2px;
            align-items: flex-end;
          }

          .score-info .score,
          .score-info .percentage {
            font-size: 0.7rem;
          }
        }

        /* Very small devices (iPhone 5/SE) */
        @media (max-width: 280px) {
          .complete-results {
            padding: 4px;
          }

          .results-container {
            padding: 10px 6px;
            border-radius: 12px;
          }

          .ranking-item {
            padding: 5px;
            gap: 3px;
          }

          .rank-badge {
            width: 25px;
            font-size: 0.7rem;
          }

          .name {
            font-size: 0.75rem;
          }

          .score-info .score,
          .score-info .percentage {
            font-size: 0.65rem;
          }

          .retake-btn {
            padding: 10px 12px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CompleteResults;