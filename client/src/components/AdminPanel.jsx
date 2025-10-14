import React, { useState, useEffect } from 'react';
import { parseMCQText } from '../utils/mcqParser';
import { 
  saveQuiz, getActiveQuiz, setActiveQuiz, getQuizResults, clearActiveQuiz, 
  deleteQuiz, deleteQuizResults, getQuizzesByClass, getQuizClasses,
  getOverallTopStudents, getResultsByQuiz, getQuizzes
} from '../utils/storage';

function AdminPanel() {
  const [mcqText, setMcqText] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [activeQuiz, setActiveQuizState] = useState(null);
  const [results, setResults] = useState([]);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [quizName, setQuizName] = useState('');
  const [quizClass, setQuizClass] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [liveParticipants, setLiveParticipants] = useState(0);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [classQuizzes, setClassQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [topStudents, setTopStudents] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [selectedClass]);

  const loadData = async () => {
    try {
      await loadActiveQuiz();
      await loadResults();
      loadClasses();
      await loadTopStudents();
      await loadAllQuizzes();
      if (selectedClass) {
        await loadClassQuizzes();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadActiveQuiz = async () => {
    try {
      const active = await getActiveQuiz();
      setActiveQuizState(active);
    } catch (error) {
      console.error('Error loading active quiz:', error);
      setActiveQuizState(null);
    }
  };

  const loadResults = async () => {
    try {
      const quizResults = await getQuizResults();
      setResults(quizResults);
      
      if (activeQuiz) {
        const participants = quizResults.filter(r => 
          r.quizId === activeQuiz.id && 
          Date.now() - r.timestamp < 300000
        ).length;
        setLiveParticipants(participants);
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setResults([]);
    }
  };

  const loadClasses = () => {
    try {
      const classList = getQuizClasses();
      setClasses(classList);
      if (classList.length > 0 && !selectedClass) {
        setSelectedClass(classList[0]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  const loadAllQuizzes = async () => {
    try {
      const quizzes = await getQuizzes();
      setAllQuizzes(quizzes);
    } catch (error) {
      console.error('Error loading all quizzes:', error);
      setAllQuizzes([]);
    }
  };

  const loadClassQuizzes = async () => {
    try {
      const quizzes = await getQuizzesByClass(selectedClass);
      setClassQuizzes(quizzes);
    } catch (error) {
      console.error('Error loading class quizzes:', error);
      setClassQuizzes([]);
    }
  };

  const loadTopStudents = async () => {
    try {
      const top = await getOverallTopStudents(5);
      setTopStudents(top);
    } catch (error) {
      console.error('Error loading top students:', error);
      setTopStudents([]);
    }
  };

  const handleParseMCQ = () => {
    try {
      const parsedQuiz = parseMCQText(mcqText, timePerQuestion);
      parsedQuiz.name = quizName;
      parsedQuiz.class = quizClass;
      if (scheduledTime) {
        parsedQuiz.scheduledTime = new Date(scheduledTime).getTime();
        parsedQuiz.status = 'scheduled';
      }
      setQuiz(parsedQuiz);
      alert(`✅ Successfully parsed ${parsedQuiz.questions.length} questions!`);
    } catch (error) {
      alert('❌ Error parsing MCQs: ' + error.message);
    }
  };

  const handleStartQuiz = async () => {
    if (!quiz) return;
    
    try {
      const quizToStart = {
        ...quiz,
        id: Date.now().toString(),
        startTime: Date.now(),
        status: 'active'
      };
      
      const startedQuiz = await setActiveQuiz(quizToStart);
      setActiveQuizState(startedQuiz);
      setActiveTab('live');
      alert('🚀 Quiz started successfully! Students can now join.');
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Error starting quiz. Please try again.');
    }
  };

  const handleScheduleQuiz = async () => {
    if (!quiz || !scheduledTime) {
      alert('Please set a schedule time first');
      return;
    }
    
    const scheduleTime = new Date(scheduledTime).getTime();
    const now = Date.now();
    
    if (scheduleTime <= now) {
      alert('Scheduled time must be in future');
      return;
    }

    try {
      const scheduledQuiz = {
        ...quiz,
        id: Date.now().toString(),
        scheduledTime: scheduleTime,
        status: 'scheduled'
      };
      
      await saveQuiz(scheduledQuiz);
      setActiveTab('classes');
      
      alert(`✅ Quiz scheduled for ${new Date(scheduleTime).toLocaleString()}`);
      
      // Clear the form
      setMcqText('');
      setQuizName('');
      setQuizClass('');
      setScheduledTime('');
      setQuiz(null);
    } catch (error) {
      console.error('Error scheduling quiz:', error);
      alert('Error scheduling quiz. Please try again.');
    }
  };

  const handleEndQuiz = async () => {
    try {
      await clearActiveQuiz();
      setActiveQuizState(null);
      await loadData();
      alert('⏹️ Quiz ended successfully!');
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('Error ending quiz. Please try again.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz and all its results?')) {
      try {
        await deleteQuiz(quizId);
        await deleteQuizResults(quizId);
        await loadData();
        alert('🗑️ Quiz deleted successfully!');
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Error deleting quiz. Please try again.');
      }
    }
  };

  const getLiveProgress = () => {
    if (!activeQuiz || !activeQuiz.questions || !activeQuiz.startTime) {
      return { progress: 0, currentQuestion: 0, totalQuestions: 0 };
    }
    
    const now = Date.now();
    const elapsed = now - activeQuiz.startTime;
    const totalDuration = activeQuiz.questions.length * (activeQuiz.timePerQuestion || 30) * 1000;
    const progress = Math.min(100, (elapsed / totalDuration) * 100);
    const currentQuestion = Math.floor(elapsed / ((activeQuiz.timePerQuestion || 30) * 1000)) + 1;
    
    return { 
      progress, 
      currentQuestion: Math.min(currentQuestion, activeQuiz.questions.length), 
      totalQuestions: activeQuiz.questions.length 
    };
  };

  const { progress, currentQuestion, totalQuestions } = getLiveProgress();

  // Early return if no active quiz in live tab
  if (activeTab === 'live' && !activeQuiz) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <div className="header-tabs">
            <button 
              className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              🎯 Create Quiz
            </button>
            <button 
              className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              📚 Classes & Quizzes
            </button>
            <button 
              className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
              onClick={() => setActiveTab('live')}
            >
              📊 Live Monitoring
            </button>
            <button 
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              📈 Analytics
            </button>
          </div>
        </div>
        <div className="admin-content">
          <div className="no-active-quiz">
            <h3>No Active Quiz</h3>
            <p>Start a quiz from the Create Quiz tab to see live monitoring.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <div className="header-tabs">
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            🎯 Create Quiz
          </button>
          <button 
            className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
          >
            📚 Classes & Quizzes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            📊 Live Monitoring
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Create Quiz Tab */}
        {activeTab === 'create' && (
          <div className="tab-content">
            <div className="create-quiz-section">
              <h3>Create New Quiz</h3>
              
              <div className="quiz-meta-grid">
                <div className="meta-group">
                  <label>Quiz Name</label>
                  <input
                    type="text"
                    placeholder="Enter quiz name"
                    value={quizName}
                    onChange={(e) => setQuizName(e.target.value)}
                  />
                </div>
                <div className="meta-group">
                  <label>Class</label>
                  <input
                    type="text"
                    placeholder="e.g., Class 10th"
                    value={quizClass}
                    onChange={(e) => setQuizClass(e.target.value)}
                  />
                </div>
                <div className="meta-group">
                  <label>Time per Question (seconds)</label>
                  <input
                    type="number"
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(parseInt(e.target.value) || 30)}
                    min="10"
                    max="120"
                  />
                </div>
                <div className="meta-group">
                  <label>Schedule Start Time (optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="mcq-input-section">
                <label>Paste MCQs</label>
                <textarea
                  value={mcqText}
                  onChange={(e) => setMcqText(e.target.value)}
                  placeholder={`Format:
What is React?
A) Framework
B) Library
C) Language
D) Database
Correct: B

Next question...
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Correct: C`}
                  rows="15"
                />
              </div>

              <div className="action-buttons">
                <button onClick={handleParseMCQ} disabled={!mcqText.trim()} className="btn-primary">
                  ✅ Parse MCQs
                </button>
                {scheduledTime ? (
                  <button onClick={handleScheduleQuiz} disabled={!quiz} className="btn-warning">
                    📅 Schedule Quiz
                  </button>
                ) : (
                  <button onClick={handleStartQuiz} disabled={!quiz || activeQuiz} className="btn-success">
                    🚀 Start Quiz Now
                  </button>
                )}
              </div>

              {quiz && (
                <div className="quiz-preview">
                  <h4>Quiz Preview ({quiz.questions?.length || 0} questions)</h4>
                  <div className="preview-questions">
                    {quiz.questions?.slice(0, 3).map((q, index) => (
                      <div key={index} className="preview-question">
                        <strong>Q{index + 1}:</strong> {q.question}
                        <div className="correct-answer">Correct: {q.correctAnswer}</div>
                      </div>
                    ))}
                    {quiz.questions && quiz.questions.length > 3 && (
                      <div className="more-questions">+ {quiz.questions.length - 3} more questions</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Classes & Quizzes Tab */}
        {activeTab === 'classes' && (
          <div className="tab-content">
            <div className="classes-section">
              <div className="section-header">
                <h3>📚 Classes & Quizzes</h3>
                <div className="class-filter">
                  <label>Filter by Class:</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="classes-grid">
                {classes.map(className => {
                  const classQuizzes = allQuizzes.filter(q => q.class === className);
                  const activeQuiz = classQuizzes.find(q => q.status === 'active');
                  const scheduledQuizzes = classQuizzes.filter(q => q.status === 'scheduled');
                  const pastQuizzes = classQuizzes.filter(q => !q.status || q.status === 'completed');
                  
                  return (
                    <div key={className} className="class-card">
                      <div className="class-header">
                        <h4>{className}</h4>
                        <span className="quiz-count">{classQuizzes.length} quizzes</span>
                      </div>
                      
                      <div className="class-stats">
                        <div className="stat">
                          <span>Active</span>
                          <strong className="active-count">{activeQuiz ? 1 : 0}</strong>
                        </div>
                        <div className="stat">
                          <span>Scheduled</span>
                          <strong className="scheduled-count">{scheduledQuizzes.length}</strong>
                        </div>
                        <div className="stat">
                          <span>Completed</span>
                          <strong className="completed-count">{pastQuizzes.length}</strong>
                        </div>
                      </div>

                      <div className="class-quizzes">
                        {activeQuiz && (
                          <div className="quiz-item active">
                            <span className="quiz-name">{activeQuiz.name}</span>
                            <span className="quiz-status live">LIVE</span>
                          </div>
                        )}
                        
                        {scheduledQuizzes.map(quiz => (
                          <div key={quiz.id} className="quiz-item scheduled">
                            <span className="quiz-name">{quiz.name}</span>
                            <span className="quiz-time">
                              {new Date(quiz.scheduledTime).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        
                        {pastQuizzes.slice(0, 3).map(quiz => (
                          <div key={quiz.id} className="quiz-item completed">
                            <span className="quiz-name">{quiz.name}</span>
                            <span className="quiz-status">Completed</span>
                          </div>
                        ))}
                        
                        {pastQuizzes.length > 3 && (
                          <div className="more-quizzes">
                            + {pastQuizzes.length - 3} more completed quizzes
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All Quizzes Table */}
              <div className="all-quizzes-section">
                <h4>All Quizzes</h4>
                <div className="quizzes-table">
                  {allQuizzes.map(quiz => {
                    const quizResults = results.filter(r => r.quizId === quiz.id);
                    const avgScore = quizResults.length > 0 
                      ? Math.round(quizResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / quizResults.length)
                      : 0;
                    
                    return (
                      <div key={quiz.id} className="quiz-row">
                        <div className="quiz-info">
                          <div className="quiz-name">{quiz.name}</div>
                          <div className="quiz-class">{quiz.class}</div>
                        </div>
                        <div className="quiz-stats">
                          <span>{quiz.questions?.length || 0} Qs</span>
                          <span>{quiz.timePerQuestion || 30}s/Q</span>
                        </div>
                        <div className="quiz-status">
                          {quiz.status === 'active' && <span className="status-live">LIVE</span>}
                          {quiz.status === 'scheduled' && (
                            <span className="status-scheduled">
                              {new Date(quiz.scheduledTime).toLocaleString()}
                            </span>
                          )}
                          {(!quiz.status || quiz.status === 'completed') && (
                            <span className="status-completed">Completed</span>
                          )}
                        </div>
                        <div className="quiz-results">
                          <span>{quizResults.length} participants</span>
                          <span>{avgScore}% avg</span>
                        </div>
                        <div className="quiz-actions">
                          <button 
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="btn-danger btn-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Monitoring Tab */}
        {activeTab === 'live' && activeQuiz && (
          <div className="tab-content">
            <div className="live-monitoring">
              <div className="live-header">
                <h3>Live Quiz: {activeQuiz.name}</h3>
                <button onClick={handleEndQuiz} className="btn-danger">
                  ⏹️ End Quiz
                </button>
              </div>

              <div className="live-stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{liveParticipants}</div>
                  <div className="stat-label">Live Participants</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{currentQuestion}/{totalQuestions}</div>
                  <div className="stat-label">Current Question</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{activeQuiz.timePerQuestion || 30}s</div>
                  <div className="stat-label">Time per Question</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {Math.round(progress)}%
                  </div>
                  <div className="stat-label">Progress</div>
                </div>
              </div>

              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="live-results">
                <h4>Live Results</h4>
                <div className="results-table">
                  {getResultsByQuiz(activeQuiz.id)
                    ?.sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((result, index) => (
                    <div key={index} className="result-row">
                      <div className="rank">#{index + 1}</div>
                      <div className="student-name">{result.studentName}</div>
                      <div className="score">{result.score || 0}/{result.totalQuestions || 0}</div>
                      <div className="percentage">{result.percentage || 0}%</div>
                      <div className="missed">{result.missedQuestions || 0} missed</div>
                    </div>
                  )) || (
                    <div className="no-results">
                      <p>No results yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="tab-content">
            <div className="analytics-section">
              <h3>Overall Analytics</h3>
              
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4>🏆 Top Performers</h4>
                  <div className="top-performers-list">
                    {topStudents.map((student, index) => (
                      <div key={index} className="top-performer">
                        <div className="performer-rank">#{index + 1}</div>
                        <div className="performer-info">
                          <div className="performer-name">{student.name}</div>
                          <div className="performer-stats">
                            {student.averagePercentage || 0}% avg • {student.totalQuizzes || 0} quizzes
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analytics-card">
                  <h4>📊 Overall Statistics</h4>
                  <div className="overall-stats">
                    <div className="overall-stat">
                      <span>Total Quizzes</span>
                      <strong>{allQuizzes.length}</strong>
                    </div>
                    <div className="overall-stat">
                      <span>Total Participants</span>
                      <strong>{[...new Set(results.map(r => r.studentName))].length}</strong>
                    </div>
                    <div className="overall-stat">
                      <span>Total Submissions</span>
                      <strong>{results.length}</strong>
                    </div>
                    <div className="overall-stat">
                      <span>Classes</span>
                      <strong>{classes.length}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h4>Recent Activity</h4>
                <div className="activity-list">
                  {results
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                    .slice(0, 10)
                    .map((result, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-info">
                        <strong>{result.studentName}</strong> scored {result.percentage || 0}% in {result.quizName}
                      </div>
                      <div className="activity-time">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;