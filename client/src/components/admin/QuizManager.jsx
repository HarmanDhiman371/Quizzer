import React, { useState, useEffect } from 'react';
import { getQuizzesFromFirestore, deleteQuizFromFirestore, setActiveQuiz, endActiveQuiz } from '../../utils/firestore';

const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadQuizzes();
    // Refresh every 10 seconds to get updated status
    const interval = setInterval(loadQuizzes, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const allQuizzes = await getQuizzesFromFirestore();
      
      // Filter out completed quizzes from the main list
      const filteredQuizzes = allQuizzes.filter(quiz => 
        quiz.status !== 'completed'
      );
      
      setQuizzes(filteredQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      alert('Error loading quizzes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quiz) => {
    try {
      const quizToStart = {
        ...quiz,
        status: 'active',
        quizStartTime: Date.now(),
        currentQuestionIndex: 0,
        totalParticipants: 0
      };

      await setActiveQuiz(quizToStart);
      alert(`🚀 Started quiz: ${quiz.name}`);
      await loadQuizzes();
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Error starting quiz: ' + error.message);
    }
  };

  const handleDeleteQuiz = async (quizId, quizName) => {
    if (!window.confirm(`Are you sure you want to delete "${quizName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteQuizFromFirestore(quizId);
      alert('🗑️ Quiz deleted successfully!');
      await loadQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Error deleting quiz: ' + error.message);
    }
  };

  const handleEndActiveQuiz = async () => {
    try {
      await endActiveQuiz();
      alert('⏹️ Active quiz ended!');
      await loadQuizzes();
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('Error ending quiz: ' + error.message);
    }
  };

  const handleCleanupCompleted = async () => {
    try {
      const allQuizzes = await getQuizzesFromFirestore();
      const completedQuizzes = allQuizzes.filter(quiz => quiz.status === 'completed');
      
      for (const quiz of completedQuizzes) {
        await deleteQuizFromFirestore(quiz.id);
      }
      
      alert(`🗑️ Cleaned up ${completedQuizzes.length} completed quizzes!`);
      await loadQuizzes();
    } catch (error) {
      console.error('Error cleaning up quizzes:', error);
      alert('Error cleaning up quizzes: ' + error.message);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    switch (activeTab) {
      case 'scheduled':
        return quiz.status === 'scheduled';
      case 'drafts':
        return quiz.status === 'draft';
      case 'completed':
        return quiz.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'LIVE', class: 'status-live' },
      scheduled: { label: 'SCHEDULED', class: 'status-scheduled' },
      draft: { label: 'DRAFT', class: 'status-draft' },
      completed: { label: 'COMPLETED', class: 'status-completed' }
    };
    
    const config = statusConfig[status] || { label: status, class: 'status-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="quiz-manager">
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-manager">
      <div className="manager-header">
        <h3>📚 Quiz Manager</h3>
        <div className="manager-actions-header">
          <button onClick={loadQuizzes} className="btn btn-secondary">
            🔄 Refresh
          </button>
          <button onClick={handleCleanupCompleted} className="btn btn-warning">
            🧹 Cleanup Completed
          </button>
        </div>
      </div>

      <div className="quiz-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({quizzes.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled ({quizzes.filter(q => q.status === 'scheduled').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          Drafts ({quizzes.filter(q => q.status === 'draft').length})
        </button>
      </div>

      <div className="quizzes-list">
        {filteredQuizzes.length === 0 ? (
          <div className="empty-state">
            <p>No quizzes found in this category.</p>
          </div>
        ) : (
          filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-info">
                <div className="quiz-header">
                  <h4>{quiz.name}</h4>
                  {getStatusBadge(quiz.status)}
                </div>
                <p className="quiz-class">{quiz.class}</p>
                <div className="quiz-details">
                  <span>{quiz.questions?.length || 0} questions</span>
                  <span>{quiz.timePerQuestion}s per question</span>
                  <span>Total: {Math.ceil((quiz.questions?.length || 0) * quiz.timePerQuestion / 60)}min</span>
                </div>
                {quiz.scheduledTime && (
                  <p className="scheduled-time">
                    🕒 {new Date(quiz.scheduledTime).toLocaleString()}
                  </p>
                )}
                <p className="created-time">
                  Created: {quiz.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                </p>
              </div>
              
              <div className="quiz-actions">
                {quiz.status === 'draft' && (
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="btn btn-success btn-sm"
                  >
                    🚀 Start
                  </button>
                )}
                
                {quiz.status === 'scheduled' && (
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="btn btn-warning btn-sm"
                  >
                    ▶️ Start Now
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteQuiz(quiz.id, quiz.name)}
                  className="btn btn-danger btn-sm"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="manager-actions">
        <button onClick={handleEndActiveQuiz} className="btn btn-danger">
          ⏹️ End Active Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizManager;