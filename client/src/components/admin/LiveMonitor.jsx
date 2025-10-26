import React, { useState, useEffect, useRef } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import { endActiveQuiz, pauseQuiz, resumeQuiz, deleteClassResult, listenToQuizResults } from '../../utils/firestore';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const LiveMonitor = () => {
  const { activeQuiz } = useQuiz();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [visibleRange, setVisibleRange] = useState([0, 20]);
  const listRef = useRef();

  // Function to manually start the quiz - KEEP ORIGINAL WORKING VERSION
  const handleStartQuiz = async () => {
    try {
      console.log('🎬 Admin manually starting quiz...');
      setLoading(true);
      
      const activeQuizRef = doc(db, 'activeQuiz', 'current');
      await updateDoc(activeQuizRef, {
        status: 'active',
        quizStartTime: Date.now(),
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Quiz started manually by admin');
      alert('🚀 Quiz started! Students will begin now.');
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Error starting quiz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for results
  useEffect(() => {
    if (!activeQuiz?.id) {
      setResults([]);
      return;
    }

    console.log('🎯 Setting up real-time listener for quiz:', activeQuiz.id);
    
    const unsubscribe = listenToQuizResults(activeQuiz.id, (quizResults) => {
      console.log('📊 Real-time update:', quizResults.length, 'participants');
      
      const processedResults = quizResults.map(result => ({
        ...result,
        score: Number(result.score) || 0,
        percentage: Number(result.percentage) || 0,
        tabSwitches: Number(result.tabSwitches) || 0
      }));
      
      setResults(processedResults);
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
      const itemHeight = 80;
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

  // Show waiting room section when quiz is in waiting status
  if (activeQuiz.status === 'waiting') {
    const waitingParticipants = activeQuiz.waitingParticipants || [];
    
    return (
      <div className="live-monitor">
        <div className="waiting-quiz-section">
          <div className="waiting-header">
            <div className="waiting-icon">⏳</div>
            <h3>Quiz Ready to Start</h3>
            <p className="quiz-info">
              <strong>{activeQuiz.name}</strong> • Class: {activeQuiz.class} • {activeQuiz.questions?.length || 0} Questions
            </p>
          </div>

          <div className="waiting-stats">
            <div className="stat-card">
              <div className="stat-value">{waitingParticipants.length}</div>
              <div className="stat-label">Students in Waiting Room</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeQuiz.questions?.length || 0}</div>
              <div className="stat-label">Total Questions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeQuiz.timePerQuestion}s</div>
              <div className="stat-label">Time per Question</div>
            </div>
          </div>

          <div className="start-quiz-section">
            <h4>🚀 Start Quiz Now</h4>
            <p>All set! Click the button below to start the quiz for all students in the waiting room.</p>
            <button 
              onClick={handleStartQuiz}
              disabled={loading}
              className="btn-start-quiz"
            >
              {loading ? 'Starting...' : '🎬 Start Quiz Now'}
            </button>
          </div>

          {waitingParticipants.length > 0 && (
            <div className="waiting-participants">
              <h5>👥 Students in Waiting Room ({waitingParticipants.length})</h5>
              <div className="participants-grid">
                {waitingParticipants.map((participant, index) => (
                  <div key={index} className="participant-badge">
                    <span className="participant-avatar">👤</span>
                    <span className="participant-name">{participant}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .waiting-quiz-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            text-align: center;
          }

          .waiting-header {
            margin-bottom: 30px;
          }

          .waiting-icon {
            font-size: 4rem;
            margin-bottom: 15px;
          }

          .waiting-header h3 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1.8rem;
          }

          .quiz-info {
            color: #6c757d;
            font-size: 1rem;
            margin: 0;
          }

          .waiting-stats {
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

          .start-quiz-section {
            background: rgba(40, 167, 69, 0.1);
            border: 2px solid #28a745;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
          }

          .start-quiz-section h4 {
            color: #28a745;
            margin-bottom: 10px;
            font-size: 1.4rem;
          }

          .start-quiz-section p {
            color: #155724;
            margin-bottom: 20px;
            font-size: 1rem;
          }

          .btn-start-quiz {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
          }

          .btn-start-quiz:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
          }

          .btn-start-quiz:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .waiting-participants {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
          }

          .waiting-participants h5 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.1rem;
          }

          .participants-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
          }

          .participant-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            background: white;
            padding: 8px 15px;
            border-radius: 20px;
            border: 1px solid #e9ecef;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }

          .participant-avatar {
            font-size: 1rem;
          }

          .participant-name {
            color: #495057;
            font-weight: 500;
            font-size: 0.9rem;
          }

          @media (max-width: 768px) {
            .waiting-stats {
              grid-template-columns: repeat(2, 1fr);
            }

            .btn-start-quiz {
              padding: 12px 30px;
              font-size: 1.1rem;
            }

            .participants-grid {
              justify-content: flex-start;
            }
          }
        `}</style>
      </div>
    );
  }

  // Process participants with accurate scores and tab switches
  const processParticipants = () => {
    const uniqueParticipants = [];
    const seenStudents = new Set();
    
    results.forEach(result => {
      const studentKey = result.studentName;
      
      if (!seenStudents.has(studentKey)) {
        seenStudents.add(studentKey);
        uniqueParticipants.push({
          ...result,
          score: Number(result.score) || 0,
          percentage: Number(result.percentage) || 0,
          tabSwitches: Number(result.tabSwitches) || 0,
          completedAt: result.completedAt || null
        });
      }
    });
    
    // Sort by score descending, then by completion time
    return uniqueParticipants.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.completedAt || 0) - (b.completedAt || 0);
    });
  };

  const participants = processParticipants();
  const visibleParticipants = participants.slice(visibleRange[0], visibleRange[1]);
  const itemHeight = 80;
  const totalHeight = participants.length * itemHeight;
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
          <div className="stat-value">{participants.length}</div>
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
        <h4>🏆 Live Ranking ({participants.length} participants)</h4>
        
        {participants.length === 0 ? (
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
                  const totalQuestions = activeQuiz.questions?.length || 1;
                  const percentage = Math.round((result.score / totalQuestions) * 100);
                  
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
                      <span className="score">{result.score}/{totalQuestions}</span>
                      <span className="percentage">{percentage}%</span>
                      <span className="tab-switches">
                        {result.tabSwitches > 0 ? (
                          <span className="tab-warning" title={`${result.tabSwitches} tab switches detected`}>
                            🔄 {result.tabSwitches}
                          </span>
                        ) : (
                          <span className="tab-ok" title="No tab switches detected">
                            ✅
                          </span>
                        )}
                      </span>
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
          height: 500px;
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

        .tab-switches {
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
          border: 1px solid #ffeaa7;
        }

        .tab-ok {
          color: #28a745;
          font-size: 0.9rem;
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

          .rank, .score, .percentage, .tab-switches, .status {
            width: auto;
            margin-right: 10px;
          }

          .student {
            min-width: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveMonitor;