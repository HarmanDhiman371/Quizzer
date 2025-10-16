import React, { useState, useEffect, useCallback } from 'react';
import { useQuizSync } from '../../hooks/useQuizSync';
import { saveOrUpdateQuizResult } from '../../utils/firestore';
import Timer from '../shared/Timer';
import './quiz.css';

const QuizInterface = ({ activeQuiz, studentName, onQuizComplete }) => {
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [joinTime, setJoinTime] = useState(Date.now());
  const [hasSavedFinal, setHasSavedFinal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  
  // Validate quiz data on component mount
  const validateQuizData = (quiz) => {
    console.log('🔍 Validating quiz data:', {
      hasQuiz: !!quiz,
      hasQuestions: !!quiz?.questions,
      questionsCount: quiz?.questions?.length,
      questionsArray: quiz?.questions
    });

    if (!quiz) {
      console.error('❌ No quiz data provided');
      return false;
    }

    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      console.error('❌ Questions is not an array:', quiz.questions);
      return false;
    }

    if (quiz.questions.length === 0) {
      console.error('❌ Questions array is empty');
      return false;
    }

    // Validate each question
    const validQuestions = quiz.questions.every((question, index) => {
      const isValid = question && 
                     question.question && 
                     question.options && 
                     Array.isArray(question.options) && 
                     question.options.length > 0 &&
                     question.correctAnswer;
      
      if (!isValid) {
        console.error(`❌ Invalid question at index ${index}:`, question);
      }
      return isValid;
    });

    if (!validQuestions) {
      console.error('❌ Some questions are invalid');
      return false;
    }

    console.log('✅ Quiz data validation passed');
    return true;
  };

  const {
    currentQuestionIndex,
    timeRemaining,
    quizStatus,
    calculateMissedQuestions
  } = useQuizSync(activeQuiz);

  // Enter fullscreen function - must be called from user gesture
  const enterFullscreen = () => {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setQuizStarted(true);
      }).catch(err => {
        console.log('Fullscreen error:', err);
        // If fullscreen fails, still start the quiz
        setQuizStarted(true);
      });
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
      setIsFullscreen(true);
      setQuizStarted(true);
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
      setIsFullscreen(true);
      setQuizStarted(true);
    } else {
      // Fullscreen not supported, still start the quiz
      console.log('Fullscreen not supported');
      setQuizStarted(true);
    }
  };

  // Exit fullscreen function
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.msFullscreenElement;
      setIsFullscreen(!!fullscreenElement);
      
      // If user exits fullscreen manually, keep quiz running
      if (!fullscreenElement && quizStarted) {
        // Quiz continues but without fullscreen
        console.log('User exited fullscreen manually');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [quizStarted]);

  // Auto-exit fullscreen when quiz ends
  useEffect(() => {
    if (quizStatus === 'ended' && isFullscreen) {
      // Small delay to show completion message before exiting fullscreen
      setTimeout(() => {
        exitFullscreen();
      }, 2000);
    }
  }, [quizStatus, isFullscreen]);

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
      // Prevent F11 for fullscreen
      if (e.key === 'F11') {
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

  // Validate quiz data when component mounts or activeQuiz changes
  useEffect(() => {
    if (activeQuiz) {
      const isValid = validateQuizData(activeQuiz);
      if (!isValid) {
        console.error('🚨 Invalid quiz data, cannot proceed');
      }
    }
  }, [activeQuiz]);

  // Calculate score function with useCallback to prevent recreation
  const calculateScore = useCallback((currentAnswers) => {
    if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) {
      console.error('❌ Cannot calculate score: No questions available');
      return 0;
    }
    
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

  // Initialize answers only once
  useEffect(() => {
    if (activeQuiz && activeQuiz.questions && activeQuiz.questions.length > 0 && answers.length === 0) {
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
    if (quizStatus !== 'active' || !quizStarted) return;
    
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

  // Handle quiz completion
  useEffect(() => {
    if (quizStatus === 'ended' && !hasSavedFinal && activeQuiz && quizStarted) {
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
    calculateScore,
    quizStarted
  ]);

  // Check if current question was missed
  const isQuestionMissed = currentQuestionIndex < calculateMissedQuestions(joinTime);

  // Show loading if quiz data is invalid
  if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) {
    return (
      <div className="quiz-interface">
        <div className="quiz-error">
          <div className="error-icon">⚠️</div>
          <h3>Quiz Not Available</h3>
          <p>There seems to be an issue with the quiz data.</p>
          <p>Please contact your teacher.</p>
          <div className="error-details">
            <p>Debug Info:</p>
            <ul>
              <li>Has Quiz: {activeQuiz ? 'Yes' : 'No'}</li>
              <li>Has Questions: {activeQuiz?.questions ? 'Yes' : 'No'}</li>
              <li>Questions Count: {activeQuiz?.questions?.length || 0}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show start screen if quiz hasn't started
  if (!quizStarted) {
    return (
      <div className="quiz-interface">
        <div className="quiz-start-screen">
          <div className="start-container">
            <div className="start-icon">🚀</div>
            <h1>Ready to Start?</h1>
            <p>You are about to begin: <strong>{activeQuiz.name}</strong></p>
            
            <div className="quiz-info-card">
              <h3>Quiz Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Class</span>
                  <span className="value">{activeQuiz.class}</span>
                </div>
                <div className="info-item">
                  <span className="label">Questions</span>
                  <span className="value">{activeQuiz.questions.length}</span>
                </div>
                <div className="info-item">
                  <span className="label">Time per Q</span>
                  <span className="value">{activeQuiz.timePerQuestion}s</span>
                </div>
                <div className="info-item">
                  <span className="label">Total Time</span>
                  <span className="value">
                    {Math.ceil((activeQuiz.questions.length * activeQuiz.timePerQuestion) / 60)} min
                  </span>
                </div>
              </div>
            </div>

            <div className="instructions">
              <h4>📋 Important Instructions</h4>
              <ul>
                <li>✅ The quiz will open in fullscreen mode</li>
                <li>⏱️ Each question has {activeQuiz.timePerQuestion} seconds</li>
                <li>📱 Do not refresh or leave the page</li>
                <li>🚫 Switching tabs may end your quiz</li>
                <li>🎯 Answer carefully - you can't go back!</li>
                <li>💡 Select your answer and it will be saved automatically</li>
              </ul>
            </div>

            <button 
              className="start-quiz-btn"
              onClick={enterFullscreen}
            >
              🚀 Start Quiz Now
            </button>

            <p className="start-note">
              Click the button above to begin your assessment in fullscreen mode
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= activeQuiz.questions.length) {
    return (
      <div className="quiz-interface">
        <div className="quiz-complete">
          <div className="complete-icon">✅</div>
          <h3>Quiz Complete!</h3>
          <p>Your results are being calculated...</p>
          <p className="complete-note">You will be redirected to results shortly</p>
        </div>
      </div>
    );
  }

  const currentQuestion = activeQuiz.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="quiz-interface">
        <div className="quiz-error">
          <div className="error-icon">❓</div>
          <h3>Question Loading...</h3>
          <p>Please wait while the question loads.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`quiz-interface ${isFullscreen ? 'fullscreen-active' : ''}`}>
      {/* Fullscreen Warning */}
      {isFullscreen && (
        <div className="fullscreen-warning">
          ⚠️ Assessment in Progress - Do not switch tabs or windows!
        </div>
      )}

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