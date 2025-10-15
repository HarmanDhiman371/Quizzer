import React, { useState, useEffect } from 'react';
import { getClassResults } from '../../utils/firestore'; // Fixed import path

const ResultsManager = () => {
  const [classResults, setClassResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    loadClassResults();
  }, []);

  const loadClassResults = async () => {
    try {
      setLoading(true);
      const results = await getClassResults();
      setClassResults(results);
    } catch (error) {
      console.error('Error loading class results:', error);
      alert('Error loading results: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get unique classes from results
  const uniqueClasses = [...new Set(classResults.map(result => result.quizClass))];

  // Filter results by selected class
  const filteredResults = selectedClass === 'all' 
    ? classResults 
    : classResults.filter(result => result.quizClass === selectedClass);

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
      <div className="results-header">
        <h3>🏆 Class Results & Rankings</h3>
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
          <p>No results found for the selected class.</p>
          <p>Completed quiz results will appear here.</p>
        </div>
      ) : (
        <div className="class-results-grid">
          {filteredResults.map((result) => (
            <div key={result.id} className="class-result-card">
              <div className="result-header">
                <h4>{result.quizName}</h4>
                <span className="class-badge">{result.quizClass}</span>
              </div>
              
              <div className="result-meta">
                <p className="completion-date">
                  Completed: {result.completedAt?.toDate?.()?.toLocaleString() || 'Unknown'}
                </p>
                <p className="participants-count">
                  Participants: {result.totalParticipants || 0}
                </p>
              </div>

              {result.topRankings && result.topRankings.length > 0 && (
                <div className="top-rankings-section">
                  <h5>🏅 Top 5 Performers</h5>
                  <div className="rankings-list">
                    {result.topRankings.map((ranking, index) => (
                      <div key={index} className="ranking-item">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!result.topRankings || result.topRankings.length === 0) && (
                <div className="no-rankings">
                  <p>No rankings available for this quiz.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsManager;