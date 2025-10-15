import React, { useState, useEffect, useRef } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import { endActiveQuiz, listenToQuizResults } from '../../utils/firestore';

const LiveMonitor = () => {
  const { activeQuiz } = useQuiz();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [visibleRange, setVisibleRange] = useState([0, 20]);
  const listRef = useRef();

  // Real-time listener for results
  useEffect(() => {
    if (!activeQuiz?.id) {
      setResults([]);
      return;
    }

    console.log('🎯 Setting up real-time listener for quiz:', activeQuiz.id);
    
    const unsubscribe = listenToQuizResults(activeQuiz.id, (quizResults) => {
      console.log('📊 Real-time update:', quizResults.length, 'participants');
      setResults(quizResults);
      setLastUpdate(Date.now());
    });

    return () => {
      console.log('🎯 Cleaning up real-time listener');
      unsubscribe();
    };
  }, [activeQuiz?.id]);

  // Virtual scrolling handler
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      
      const { scrollTop, clientHeight, scrollHeight } = listRef.current;
      const itemHeight = 60;
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(clientHeight / itemHeight) + 5,
        results.length
      );
      
      setVisibleRange([startIndex, endIndex]);
    };

    if (listRef.current) {
      listRef.current.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (listRef.current) {
        listRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [results.length]);

  const handleEndQuiz = async () => {
    if (!window.confirm('Are you sure you want to end the quiz?')) return;
    
    setLoading(true);
    try {
      await endActiveQuiz();
      alert('✅ Quiz ended successfully! Top 5 rankings saved.');
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('Error ending quiz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!activeQuiz) {
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

  const visibleParticipants = uniqueParticipants.slice(visibleRange[0], visibleRange[1]);
  const itemHeight = 60;
  const totalHeight = uniqueParticipants.length * itemHeight;
  const offsetY = visibleRange[0] * itemHeight;

  return (
    <div className="live-monitor">
      <div className="monitor-header">
        <div>
          <h3>📊 Live: {activeQuiz.name}</h3>
          <p className="quiz-class">Class: {activeQuiz.class}</p>
          <p className="last-update">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()} 
            <span className="real-time-indicator"> • 🔴 LIVE</span>
          </p>
        </div>
        <button 
          onClick={handleEndQuiz} 
          disabled={loading}
          className="btn btn-danger"
        >
          {loading ? 'Ending...' : '⏹️ End Quiz & Save Rankings'}
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
          </div>
        ) : (
          <div className="virtual-list-container" ref={listRef}>
            <div 
              className="virtual-list-wrapper"
              style={{ height: totalHeight }}
            >
              <div 
                className="virtual-list-content"
                style={{ transform: `translateY(${offsetY}px)` }}
              >
                {visibleParticipants.map((result, index) => {
                  const globalIndex = visibleRange[0] + index;
                  return (
                    <div 
                      key={result.id} 
                      className={`table-row ${globalIndex < 3 ? 'top-three' : ''}`}
                      style={{ height: itemHeight }}
                    >
                      <span className="rank">
                        {globalIndex === 0 ? '🥇' : 
                         globalIndex === 1 ? '🥈' : 
                         globalIndex === 2 ? '🥉' : `#${globalIndex + 1}`}
                      </span>
                      <span className="student">{result.studentName}</span>
                      <span className="score">{result.score || 0}/{activeQuiz.questions?.length || 0}</span>
                      <span className="percentage">{result.percentage || 0}%</span>
                      <span className="status">
                        {result.completedAt ? '✅ Completed' : '🎯 In Progress'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="ranking-notice">
        <p>🏆 <strong>Top 5 performers will be automatically saved when quiz ends</strong></p>
      </div>
    </div>
  );
};

export default LiveMonitor;