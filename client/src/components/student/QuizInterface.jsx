import React, { useState, useEffect, useCallback } from 'react';
import { useQuizSync } from '../../hooks/useQuizSync';
import { saveOrUpdateQuizResult } from '../../utils/firestore';
import Timer from '../shared/Timer';

const QuizInterface = ({ activeQuiz, studentName, onQuizComplete }) => {
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [joinTime, setJoinTime] = useState(Date.now());
  const [hasSavedFinal, setHasSavedFinal] = useState(false);
  
  const {
    currentQuestionIndex,
    timeRemaining,
    quizStatus,
    calculateMissedQuestions
  } = useQuizSync(activeQuiz);

  // Calculate score function with useCallback to prevent recreation
  const calculateScore = useCallback((currentAnswers) => {
    if (!activeQuiz || !activeQuiz.questions) return 0;
    
    const missedCount = calculateMissedQuestions(joinTime);
    let score = 0;
    
    activeQuiz.questions.forEach((question, index) => {
      if (index >= missedCount) {
        const studentAnswer = currentAnswers[index] || '';
        const correctAnswer = question.correctAnswer;
        
        if (studentAnswer === correctAnswer) {
          score++;
        }
      }
    });
    
    return score;
  }, [activeQuiz, joinTime, calculateMissedQuestions]);

  // Copy protection effect
  useEffect(() => {
    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        return false;
      }
      if (e.key === 'PrintScreen' || e.key === 'F12') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.mozUserSelect = '';
      document.body.style.msUserSelect = '';
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Initialize answers only once
  useEffect(() => {
    if (activeQuiz && activeQuiz.questions && answers.length === 0) {
      const initialAnswers = new Array(activeQuiz.questions.length).fill('');
      const missedCount = calculateMissedQuestions(joinTime);
      
      setAnswers(initialAnswers);
    }
  }, [activeQuiz, answers.length, calculateMissedQuestions, joinTime]);

  // Update selected answer when question changes
  useEffect(() => {
    const currentAnswer = answers[currentQuestionIndex];
    setSelectedAnswer(currentAnswer || '');
  }, [currentQuestionIndex, answers]);

  // Handle answer selection
  const handleAnswerSelect = async (answer) => {
    if (quizStatus !== 'active') return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    
    setAnswers(newAnswers);
    setSelectedAnswer(answer);

    // Save progress to Firebase
    try {
      const score = calculateScore(newAnswers);
      await saveOrUpdateQuizResult({
        studentName: studentName,
        score: score,
        totalQuestions: activeQuiz.questions.length,
        percentage: Math.round((score / activeQuiz.questions.length) * 100),
        quizId: activeQuiz.id,
        quizName: activeQuiz.name,
        joinTime: joinTime,
        answers: newAnswers,
        currentQuestionIndex: currentQuestionIndex,
        completedAt: null
      });
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  };

  // Handle quiz completion - FIXED with proper dependencies
  useEffect(() => {
    if (quizStatus === 'ended' && !hasSavedFinal && activeQuiz) {
      const finalScore = calculateScore(answers);
      
      saveOrUpdateQuizResult({
        studentName: studentName,
        score: finalScore,
        totalQuestions: activeQuiz.questions.length,
        percentage: Math.round((finalScore / activeQuiz.questions.length) * 100),
        quizId: activeQuiz.id,
        quizName: activeQuiz.name,
        joinTime: joinTime,
        answers: answers,
        completedAt: Date.now()
      }).then(() => {
        setHasSavedFinal(true);
        onQuizComplete(finalScore);
      }).catch(error => {
        console.error('❌ Error saving final result:', error);
        setHasSavedFinal(true);
        onQuizComplete(finalScore);
      });
    }
  }, [
    quizStatus, 
    hasSavedFinal, 
    activeQuiz, 
    answers, 
    studentName, 
    joinTime, 
    onQuizComplete,
    calculateScore
  ]);

  // Check if current question was missed
  const isQuestionMissed = currentQuestionIndex < calculateMissedQuestions(joinTime);

  if (!activeQuiz || !activeQuiz.questions) {
    return <div>Loading quiz...</div>;
  }

  if (currentQuestionIndex >= activeQuiz.questions.length) {
    return (
      <div className="quiz-complete">
        <h3>✅ Quiz Complete</h3>
        <p>Calculating your results...</p>
      </div>
    );
  }

  const currentQuestion = activeQuiz.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return <div>Question loading...</div>;
  }

  return (
    <div className="quiz-interface">
      {/* Header Section */}
      <div className="quiz-header">
        <div className="header-left">
          <h2>{activeQuiz.name}</h2>
          <span className="class-badge">{activeQuiz.class}</span>
        </div>
        <div className="quiz-meta">
          <span className="question-counter">
            Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
          </span>
          <Timer timeRemaining={timeRemaining} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{
              width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`
            }}
          ></div>
        </div>
        <div className="progress-text">
          Progress: {currentQuestionIndex + 1}/{activeQuiz.questions.length} questions
        </div>
      </div>

      {/* Question Area */}
      <div className="question-area">
        {isQuestionMissed ? (
          <div className="missed-question">
            <div className="missed-icon">⏰</div>
            <h3>Question {currentQuestionIndex + 1}</h3>
            <p>You joined late and missed this question.</p>
            <p className="missed-note">Questions auto-progress every {activeQuiz.timePerQuestion} seconds</p>
          </div>
        ) : (
          <>
            <div className="question-text">
              <div className="question-header">
                <span className="question-number">Q{currentQuestionIndex + 1}</span>
                <span className="time-info">{timeRemaining}s remaining</span>
              </div>
              <div className="question-content">
                <p>{currentQuestion.question}</p>
              </div>
            </div>
            
            <div className="options-grid">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${selectedAnswer === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={quizStatus !== 'active'}
                >
                  <span className="option-label">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="option-text">{option}</span>
                  {selectedAnswer === option && (
                    <span className="option-check">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>

            {selectedAnswer && (
              <div className="answer-confirmation">
                <span className="confirmation-icon">✅</span>
                <span>Answer saved! Waiting for next question...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Student Info Footer */}
      <div className="student-info">
        <div className="student-details">
          <span className="student-name">Student: {studentName}</span>
          {calculateMissedQuestions(joinTime) > 0 && (
            <span className="missed-count">
              Missed: {calculateMissedQuestions(joinTime)} questions
            </span>
          )}
        </div>
        <div className="quiz-status-indicator">
          <span className={`status-dot ${quizStatus === 'active' ? 'active' : 'inactive'}`}></span>
          <span>{quizStatus === 'active' ? 'Live' : 'Ended'}</span>
        </div>
      </div>

      {/* Copy Protection Overlay */}
      <div className="copy-protection-overlay"></div>
    </div>
  );
};

export default QuizInterface;