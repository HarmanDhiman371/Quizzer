import React, { useState, useEffect } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import { endActiveQuiz, getQuizResultsFromFirestore } from '../../utils/firestore';

const LiveMonitor = () => {
  const { activeQuiz } = useQuiz();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Use polling instead of real-time listener while index is building
  useEffect(() => {
    if (!activeQuiz?.id) {
      setResults([]);
      return;
    }

    console.log('🎯 Setting up polling for quiz:', activeQuiz.id);
    
    const loadResults = async () => {
      try {
        const quizResults = await getQuizResultsFromFirestore(activeQuiz.id);
        console.log('📊 Polling update:', quizResults.length, 'participants');
        setResults(quizResults);
        setLastUpdate(Date.now());
      } catch (error) {
        console.error('❌ Error loading results:', error);
        // If index error, try simple query
        if (error.code === 'failed-precondition') {
          console.log('🔄 Index building, using fallback method');
          setResults([]);
        }
      }
    };

    // Load immediately
    loadResults();

    // Set up polling every 3 seconds
    const interval = setInterval(loadResults, 3000);
    
    return () => {
      console.log('🎯 Cleaning up polling');
      clearInterval(interval);
    };
  }, [activeQuiz?.id]);

  const handleEndQuiz = async () => {
    if (!window.confirm('Are you sure you want to end the quiz?')) return;
    
    setLoading(true);
    try {
      await endActiveQuiz();
      alert('✅ Quiz ended successfully!');
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('Error ending quiz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!activeQuiz || activeQuiz.status !== 'active') {
    return (
      <div className="live-monitor">
        <div className="no-active-quiz">
          <h3>📊 Live Monitor</h3>
          <p>No active quiz running. Start a quiz to see live monitoring.</p>
        </div>
      </div>
    );
  }

  // Remove duplicates and sort by score
  const uniqueParticipants = results
    .filter((result, index, self) =>
      index === self.findIndex(r => r.studentName === result.studentName)
    )
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="live-monitor">
      <div className="monitor-header">
        <div>
          <h3>📊 Live: {activeQuiz.name}</h3>
          <p className="last-update">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()} 
            {results.length > uniqueParticipants.length && 
              ` • ${results.length - uniqueParticipants.length} duplicates filtered`
            }
          </p>
        </div>
        <button 
          onClick={handleEndQuiz} 
          disabled={loading}
          className="btn btn-danger"
        >
          {loading ? 'Ending...' : '⏹️ End Quiz'}
        </button>
      </div>

      <div className="live-stats">
        <div className="stat-card">
          <div className="stat-value">{uniqueParticipants.length}</div>
          <div className="stat-label">Participants</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeQuiz.questions?.length || 0}</div>
          <div className="stat-label">Total Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeQuiz.timePerQuestion}s</div>
          <div className="stat-label">Time per Question</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {activeQuiz.currentQuestionIndex + 1}/{activeQuiz.questions?.length || 0}
          </div>
          <div className="stat-label">Current Question</div>
        </div>
      </div>

      <div className="participants-list">
        <h4>🏆 Live Ranking ({uniqueParticipants.length} participants)</h4>
        
        {uniqueParticipants.length === 0 ? (
          <div className="empty-state">
            <p>No participants yet. Waiting for students to join...</p>
            <p className="info-text">
              <small>📝 Index is building... Live updates every 3 seconds</small>
            </p>
          </div>
        ) : (
          <div className="results-table">
            <div className="table-header">
              <span>Rank</span>
              <span>Student</span>
              <span>Score</span>
              <span>Percentage</span>
              <span>Status</span>
            </div>
            {uniqueParticipants.map((result, index) => (
              <div key={result.id} className={`table-row ${index < 3 ? 'top-three' : ''}`}>
                <span className="rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <span className="student">{result.studentName}</span>
                <span className="score">{result.score || 0}/{activeQuiz.questions?.length || 0}</span>
                <span className="percentage">{result.percentage || 0}%</span>
                <span className="status">
                  {result.completedAt ? '✅ Completed' : '🎯 In Progress'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Index Status Info */}
      <div className="index-info">
        <p>
          <strong>ℹ️ Index Status:</strong> Building composite index for faster queries. 
          This may take a few minutes. Live updates are currently polling every 3 seconds.
        </p>
        <p>
          <small>
            You can check index status: 
            <a 
              href="https://console.firebase.google.com/v1/r/project/first-a7079/firestore/indexes" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Firebase Console → Firestore → Indexes
            </a>
          </small>
        </p>
      </div>
    </div>
  );
};

export default LiveMonitor;