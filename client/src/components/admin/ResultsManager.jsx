import React, { useState, useEffect } from 'react';
import { getAllClassResults, deleteClassResult } from '../../utils/firestore';
import AdminCompleteResults from './AdminCompleteResults';

const ResultsManager = () => {
  const [classResults, setClassResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showCompleteResults, setShowCompleteResults] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('info');

  useEffect(() => {
    loadClassResults();
  }, []);

  const showAlert = (message, type = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage(null);
    }, 5000);
  };

  // FIXED: Enhanced load function with better state management
  const loadClassResults = async () => {
    try {
      setLoading(true);
      const results = await getAllClassResults();

      console.log('📊 Raw results from Firestore:', results.length, results);

      // FIXED: Better duplicate filtering
      const uniqueResults = results.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item =>
          item.quizId === current.quizId &&
          item.quizName === current.quizName
        );

        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Keep the most recent result
          const existingDate = acc[existingIndex].completedAt?.toDate?.() || new Date(0);
          const currentDate = current.completedAt?.toDate?.() || new Date(0);
          if (currentDate > existingDate) {
            acc[existingIndex] = current;
          }
        }
        return acc;
      }, []);

      // Sort by completion date (newest first)
      uniqueResults.sort((a, b) => {
        const dateA = a.completedAt?.toDate?.() || new Date(0);
        const dateB = b.completedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      console.log('📊 Filtered results:', uniqueResults.length, uniqueResults);
      setClassResults(uniqueResults);
    } catch (error) {
      console.error('Error loading class results:', error);
      showAlert('Error loading results: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCompleteResults = (quiz) => {
    setSelectedQuiz(quiz);
    setShowCompleteResults(true);
  };

  const handleBackToResults = () => {
    setShowCompleteResults(false);
    setSelectedQuiz(null);
  };

  // FIXED: Enhanced delete with immediate UI update
  const handleDeleteResult = async (resultId, quizName) => {
    if (!window.confirm(`Are you sure you want to delete results for "${quizName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(resultId);
    try {
      // FIXED: Immediate UI update before Firestore operation
      const resultToDelete = classResults.find(result => result.id === resultId);
      if (resultToDelete) {
        setClassResults(prev => prev.filter(result => result.id !== resultId));
      }

      await deleteClassResult(resultId);
      showAlert(`✅ Results for "${quizName}" have been deleted successfully!`, 'success');

      // FIXED: Reload to ensure consistency, but UI is already updated
      await loadClassResults();

    } catch (error) {
      console.error('Error deleting result:', error);
      showAlert(`❌ Failed to delete results: ${error.message}`, 'error');
      // FIXED: Reload to restore correct state if delete failed
      await loadClassResults();
    } finally {
      setDeletingId(null);
    }
  };

  // Get unique classes from results
  const uniqueClasses = [...new Set(classResults.map(result => result.quizClass))];

  // Filter results by selected class
  const filteredResults = selectedClass === 'all'
    ? classResults
    : classResults.filter(result => result.quizClass === selectedClass);

  // If showing complete results, render that component
  if (showCompleteResults && selectedQuiz) {
    return (
      <div className="results-manager">
        <div className="results-header">
          <button onClick={handleBackToResults} className="btn btn-secondary">
            ← Back to Results
          </button>
          <h3>👑 Complete Results - {selectedQuiz.quizName}</h3>
        </div>
        <AdminCompleteResults quiz={selectedQuiz} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="results-manager">
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-manager">
      {/* Alert message display */}
      {alertMessage && (
        <div className={`alert alert-${alertType}`}>
          {alertMessage}
          <button
            onClick={() => setAlertMessage(null)}
            className="alert-close"
          >
            ×
          </button>
        </div>
      )}

      <div className="results-header">
        <h3>🏆 Quiz Results & Rankings</h3>
        <div className="results-actions">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="class-filter"
          >
            <option value="all">All Classes</option>
            {uniqueClasses.map(className => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
          <button onClick={loadClassResults} className="btn btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>No quiz results found.</p>
          <p>Completed quiz results will appear here.</p>
        </div>
      ) : (
        <div className="class-results-grid">
          {filteredResults.map((result) => (
            <div key={result.id} className="class-result-card">
              <div className="result-header">
                <div className="header-left">
                  <h4>{result.quizName}</h4>
                  <span className="class-badge">{result.quizClass}</span>
                </div>
                <div className="header-actions">
                  <button
                    onClick={() => handleViewCompleteResults(result)}
                    className="btn btn-info btn-sm"
                    title="View all participants and detailed results"
                  >
                    👑 View All
                  </button>
                  <button
                    onClick={() => handleDeleteResult(result.id, result.quizName)}
                    disabled={deletingId === result.id}
                    className="btn btn-danger btn-sm"
                  >
                    {deletingId === result.id ? '🗑️ Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>

              <div className="result-meta">
                <p className="completion-date">
                  Completed: {result.completedAt?.toDate?.()?.toLocaleString() || 'Unknown'}
                </p>
                <p className="participants-count">
                  Participants: {result.totalParticipants || 0}
                </p>
                {result.quizId && (
                  <p className="quiz-id">
                    Quiz ID: {result.quizId.substring(0, 8)}...
                  </p>
                )}
              </div>

            // In ResultsManager.js - Update the rankings section
              {result.topRankings && result.topRankings.length > 0 ? (
                <div className="top-rankings-section">
                  <h5>🏅 Top 5 Performers</h5>
                  <div className="rankings-list">
                    {result.topRankings.map((ranking, index) => (
                      <div key={`${result.id}-${index}`} className="ranking-item">
                        <span className="rank-position">
                          {index === 0 ? '🥇' :
                            index === 1 ? '🥈' :
                              index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <span className="student-name">{ranking.studentName}</span>
                        <span className="score-badge">
                          {ranking.score}/{ranking.totalQuestions}
                        </span>
                        <span className="percentage-badge">
                          {ranking.percentage}%
                        </span>
                        {/* 🟢 ADD THIS TAB SWITCH DISPLAY */}
                        <div className="tab-info">
                          {ranking.tabSwitches > 0 ? (
                            <span className="tab-warning" title="Tab switches detected">
                              🔄 {ranking.tabSwitches}
                            </span>
                          ) : (
                            <span className="tab-ok">✅</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="view-all-hint">
                    💡 Click "View All" to see complete participant list with tab switch details
                  </div>
                </div>
              ) : (
                <div className="no-rankings">
                  <p>No rankings available for this quiz.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .results-manager {
          padding: 0;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .alert-info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .alert-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          margin-left: auto;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
          .tab-info {
  flex-shrink: 0;
  margin-left: 8px;
}

.tab-warning {
  background: #fff3cd;
  color: #856404;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid #ffeaa7;
}

.tab-ok {
  color: #28a745;
  font-size: 0.8rem;
  background: #d4edda;
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid #c3e6cb;
}

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .results-header h3 {
          color: #2c3e50;
          margin: 0;
        }

        .results-actions {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .class-filter {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          font-size: 0.9rem;
        }

        .class-results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        .class-result-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
          transition: transform 0.2s ease;
        }

        .class-result-card:hover {
          transform: translateY(-2px);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          gap: 10px;
        }

        .header-left h4 {
          color: #2c3e50;
          margin: 0 0 8px 0;
          font-size: 1.2rem;
        }

        .class-badge {
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .result-meta {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e9ecef;
        }

        .completion-date, .participants-count, .quiz-id {
          color: #6c757d;
          margin: 5px 0;
          font-size: 0.9rem;
        }

        .quiz-id {
          font-family: monospace;
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .top-rankings-section h5 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1rem;
        }

        .rankings-list {
          space-y: 10px;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 8px;
          transition: background-color 0.2s ease;
        }

        .ranking-item:hover {
          background: #e9ecef;
        }

        .rank-position {
          width: 50px;
          font-weight: bold;
          font-size: 1rem;
        }

        .student-name {
          flex: 1;
          font-weight: 500;
          color: #2c3e50;
        }

        .score-badge {
          background: #28a745;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-right: 8px;
        }

        .percentage-badge {
          background: #17a2b8;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .view-all-hint {
          text-align: center;
          padding: 10px;
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
          color: #856404;
          font-size: 0.8rem;
          margin-top: 15px;
        }

        .no-rankings {
          text-align: center;
          padding: 20px;
          color: #6c757d;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 15px;
          opacity: 0.5;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
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

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        .btn-info:hover {
          background: #138496;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-danger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .results-header {
            flex-direction: column;
            align-items: stretch;
          }

          .results-actions {
            justify-content: space-between;
          }

          .class-results-grid {
            grid-template-columns: 1fr;
          }

          .result-header {
            flex-direction: column;
            gap: 10px;
          }

          .header-actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 480px) {
          .class-result-card {
            padding: 20px;
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

          .score-badge {
            order: 3;
          }

          .percentage-badge {
            order: 4;
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .header-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultsManager;