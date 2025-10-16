import React, { useState, useEffect, useRef } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import { endActiveQuiz, listenToQuizResults, pauseQuiz, resumeQuiz, deleteClassResult } from '../../utils/firestore';

const LiveMonitor = () => {
  const { activeQuiz } = useQuiz();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [visibleRange, setVisibleRange] = useState([0, 20]);
  const listRef = useRef();

  // Real-time listener for results - ONLY for current active quiz
  useEffect(() => {
    if (!activeQuiz?.id || activeQuiz.status === 'inactive') {
      setResults([]);
      return;
    }

    console.log('🎯 Setting up real-time listener for quiz:', activeQuiz.id);
    
    const unsubscribe = listenToQuizResults(activeQuiz.id, (quizResults) => {
      console.log('📊 Real-time update:', quizResults.length, 'participants');
      
      // Filter results to only include participants from current quiz session
      const currentQuizResults = quizResults.filter(result => 
        result.quizId === activeQuiz.id
      );
      
      setResults(currentQuizResults);
      setLastUpdate(Date.now());
    });

    return () => {
      console.log('🎯 Cleaning up real-time listener');
      unsubscribe();
    };
  }, [activeQuiz?.id, activeQuiz?.status]);

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
    if (!window.confirm('Are you sure you want to end the quiz? Students will see their results immediately.')) return;
    
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

  const handlePauseQuiz = async () => {
    try {
      await pauseQuiz();
      alert('⏸️ Quiz paused');
    } catch (error) {
      console.error('Error pausing quiz:', error);
      alert('Error pausing quiz: ' + error.message);
    }
  };

  const handleResumeQuiz = async () => {
    try {
      await resumeQuiz();
      alert('▶️ Quiz resumed');
    } catch (error) {
      console.error('Error resuming quiz:', error);
      alert('Error resuming quiz: ' + error.message);
    }
  };

  if (!activeQuiz || activeQuiz.status === 'inactive') {
    return (
      <div className="live-monitor">
        <div className="no-active-quiz">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Live Monitor</h3>
            <p>No active quiz running. Start a quiz to see live monitoring.</p>
          </div>
        </div>
      </div>
    );
  }

  // Remove duplicates and sort by score - only for current quiz
  const uniqueParticipants = results
    .filter((result, index, self) =>
      index === self.findIndex(r => 
        r.studentName === result.studentName && r.quizId === activeQuiz.id
      )
    )
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const visibleParticipants = uniqueParticipants.slice(visibleRange[0], visibleRange[1]);
  const itemHeight = 60;
  const totalHeight = uniqueParticipants.length * itemHeight;
  const offsetY = visibleRange[0] * itemHeight;

  return (
    <div className="live-monitor">
      <div className="monitor-header">
        <div className="header-info">
          <h3>📊 Live: {activeQuiz.name}</h3>
          <p className="quiz-class">Class: {activeQuiz.class}</p>
          <p className="last-update">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()} 
            <span className="real-time-indicator"> • 🔴 LIVE</span>
          </p>
        </div>
        <div className="header-actions">
          {activeQuiz.status === 'active' && (
            <button 
              onClick={handlePauseQuiz}
              className="btn btn-warning"
            >
              ⏸️ Pause Quiz
            </button>
          )}
          {activeQuiz.status === 'paused' && (
            <button 
              onClick={handleResumeQuiz}
              className="btn btn-success"
            >
              ▶️ Resume Quiz
            </button>
          )}
          <button 
            onClick={handleEndQuiz} 
            disabled={loading}
            className="btn btn-danger"
          >
            {loading ? 'Ending...' : '⏹️ End Quiz'}
          </button>
        </div>
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
        <div className="stat-card">
          <div className="stat-value">
            {activeQuiz.status === 'paused' ? '⏸️' : '▶️'}
          </div>
          <div className="stat-label">Status</div>
        </div>
      </div>

      <div className="participants-list">
        <h4>🏆 Live Ranking ({uniqueParticipants.length} participants)</h4>
        
        {uniqueParticipants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
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
                      key={`${result.id}-${result.studentName}`} 
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

      <style jsx>{`
        .live-monitor {
          padding: 0;
        }

        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          gap: 20px;
        }

        .header-info h3 {
          color: #2c3e50;
          margin-bottom: 8px;
          font-size: 1.5rem;
        }

        .quiz-class {
          color: #6c757d;
          margin-bottom: 5px;
          font-size: 0.9rem;
        }

        .last-update {
          color: #28a745;
          font-size: 0.8rem;
          margin: 0;
        }

        .real-time-indicator {
          color: #dc3545;
          font-weight: bold;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .live-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 0.8rem;
          opacity: 0.9;
        }

        .participants-list {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .participants-list h4 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.2rem;
        }

        .virtual-list-container {
          height: 400px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 8px;
        }

        .virtual-list-wrapper {
          position: relative;
        }

        .virtual-list-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
        }

        .table-row {
          display: flex;
          align-items: center;
          padding: 0 20px;
          border-bottom: 1px solid #f1f3f4;
          transition: background-color 0.2s ease;
        }

        .table-row:hover {
          background-color: #f8f9fa;
        }

        .table-row.top-three {
          background: linear-gradient(135deg, #fff3cd, #ffeaa7);
        }

        .rank {
          width: 60px;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .student {
          flex: 1;
          font-weight: 500;
          color: #2c3e50;
        }

        .score {
          width: 80px;
          text-align: center;
          font-weight: bold;
          color: #495057;
        }

        .percentage {
          width: 80px;
          text-align: center;
          color: #28a745;
          font-weight: bold;
        }

        .status {
          width: 120px;
          text-align: right;
          font-size: 0.8rem;
          color: #6c757d;
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

        .no-active-quiz {
          background: white;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .monitor-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            justify-content: center;
          }

          .live-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .table-row {
            padding: 0 10px;
            font-size: 0.9rem;
          }

          .rank, .score, .percentage, .status {
            width: auto;
            margin-right: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveMonitor;