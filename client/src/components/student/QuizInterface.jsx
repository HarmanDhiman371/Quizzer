import React, { useState, useEffect } from 'react';
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

  // Initialize answers only once
  useEffect(() => {
    if (activeQuiz && activeQuiz.questions && answers.length === 0) {
      const initialAnswers = new Array(activeQuiz.questions.length).fill('');
      const missedCount = calculateMissedQuestions(joinTime);
      
      console.log('🎯 Initializing answers array:', {
        totalQuestions: activeQuiz.questions.length,
        missedCount: missedCount,
        joinTime: new Date(joinTime).toLocaleTimeString()
      });
      
      setAnswers(initialAnswers);
    }
  }, [activeQuiz, answers.length]);

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
    
    console.log('✅ Answer selected:', {
      question: currentQuestionIndex + 1,
      answer: answer,
      student: studentName,
      allAnswers: newAnswers
    });

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
      console.log('💾 Progress saved. Current score:', score);
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  };

  // Handle quiz completion
  useEffect(() => {
    if (quizStatus === 'ended' && !hasSavedFinal) {
      const finalScore = calculateScore(answers);
      console.log('🎯 Quiz completed. Final answers:', answers, 'Final score:', finalScore);
      
      // Save final result
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
        console.log('🏁 Final result saved. Score:', finalScore);
        setHasSavedFinal(true);
        onQuizComplete(finalScore);
      }).catch(error => {
        console.error('❌ Error saving final result:', error);
        // Even if save fails, still show results to student
        setHasSavedFinal(true);
        onQuizComplete(finalScore);
      });
    }
  }, [quizStatus, hasSavedFinal]);

  // Calculate score
  const calculateScore = (currentAnswers) => {
    if (!activeQuiz || !activeQuiz.questions) return 0;
    
    const missedCount = calculateMissedQuestions(joinTime);
    let score = 0;
    
    console.log('🔍 Score calculation started:', {
      missedCount: missedCount,
      answers: currentAnswers,
      questions: activeQuiz.questions.map(q => q.correctAnswer)
    });
    
    activeQuiz.questions.forEach((question, index) => {
      if (index >= missedCount) {
        const studentAnswer = currentAnswers[index] || '';
        const correctAnswer = question.correctAnswer;
        
        if (studentAnswer === correctAnswer) {
          score++;
          console.log('✅ Q' + (index + 1) + ': CORRECT -', studentAnswer);
        } else if (studentAnswer) {
          console.log('❌ Q' + (index + 1) + ': WRONG - Student:', studentAnswer, 'Correct:', correctAnswer);
        } else {
          console.log('⏭️  Q' + (index + 1) + ': UNANSWERED');
        }
      } else {
        console.log('⏰ Q' + (index + 1) + ': MISSED (joined late)');
      }
    });
    
    console.log('🎯 Total score:', score + '/' + activeQuiz.questions.length);
    return score;
  };

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
      <div className="quiz-header">
        <h2>{activeQuiz.name}</h2>
        <div className="quiz-meta">
          <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
          <Timer timeRemaining={timeRemaining} />
        </div>
      </div>

      <div className="question-area">
        {isQuestionMissed ? (
          <div className="missed-question">
            <h3>Question {currentQuestionIndex + 1}</h3>
            <p>⏰ You joined late and missed this question.</p>
          </div>
        ) : (
          <>
            <div className="question-text">
              <h3>Question {currentQuestionIndex + 1}</h3>
              <p>{currentQuestion.question}</p>
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
                  {selectedAnswer === option && <span className="option-check">✓</span>}
                </button>
              ))}
            </div>

            {selectedAnswer && (
              <div className="answer-confirmation">
                ✅ Answer saved! - Waiting for next question...
              </div>
            )}
          </>
        )}
      </div>

      <div className="student-info">
        <span>Student: {studentName}</span>
        {calculateMissedQuestions(joinTime) > 0 && (
          <span className="missed-count">
            Missed: {calculateMissedQuestions(joinTime)} questions
          </span>
        )}
        <span className="status">
          {quizStatus === 'active' ? '🟢 Live' : '⏸️ Paused'}
        </span>
      </div>
    </div>
  );
};

export default QuizInterface;