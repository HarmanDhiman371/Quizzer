import React, { useState } from 'react';
import { setActiveQuiz, saveQuizToFirestore, endActiveQuiz } from '../../utils/firestore';

const TestAdminPanel = () => {
  const [quizName, setQuizName] = useState('Test Quiz');
  const [isLoading, setIsLoading] = useState(false);

  // Create a simple test quiz
  const createTestQuiz = () => {
  const testQuiz = {
    name: quizName,
    class: 'Test Class',
    timePerQuestion: 10, // 10 seconds per question for testing
    questions: [
      {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4"
      },
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: "Paris"
      },
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Earth", "Mars", "Jupiter", "Venus"],
        correctAnswer: "Mars"
      }
    ],
    status: 'active'
  };

  console.log('📋 Quiz data being sent to Firebase:', JSON.stringify(testQuiz, null, 2));
  return testQuiz;
};

  const handleStartQuiz = async () => {
    setIsLoading(true);
    try {
      const testQuiz = createTestQuiz();
      console.log('🚀 Starting test quiz:', testQuiz);
      
      // Set as active quiz
      await setActiveQuiz(testQuiz);
      alert('✅ Quiz started! Students can now join.');
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('❌ Error starting quiz: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleQuiz = async () => {
    setIsLoading(true);
    try {
      const testQuiz = {
        ...createTestQuiz(),
        status: 'scheduled',
        scheduledTime: Date.now() + 30000 // 30 seconds from now
      };
      
      await saveQuizToFirestore(testQuiz);
      alert('✅ Quiz scheduled to start in 30 seconds!');
    } catch (error) {
      console.error('Error scheduling quiz:', error);
      alert('❌ Error scheduling quiz: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndQuiz = async () => {
    setIsLoading(true);
    try {
      await endActiveQuiz();
      alert('✅ Quiz ended!');
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert('❌ Error ending quiz: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="test-admin-panel">
      <h2>🧪 Test Admin Panel</h2>
      <p>Use this to test the synchronization system</p>
      
      <div className="admin-controls">
        <div className="input-group">
          <label>Quiz Name:</label>
          <input 
            type="text" 
            value={quizName} 
            onChange={(e) => setQuizName(e.target.value)}
            placeholder="Enter quiz name"
          />
        </div>

        <div className="button-group">
          <button 
            onClick={handleStartQuiz} 
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Starting...' : '🚀 Start Quiz Now'}
          </button>
          
          <button 
            onClick={handleScheduleQuiz} 
            disabled={isLoading}
            className="btn btn-secondary"
          >
            {isLoading ? 'Scheduling...' : '📅 Schedule Quiz (30s)'}
          </button>
          
          <button 
            onClick={handleEndQuiz} 
            disabled={isLoading}
            className="btn btn-danger"
          >
            {isLoading ? 'Ending...' : '⏹️ End Quiz'}
          </button>
        </div>
      </div>

      <div className="test-instructions">
        <h4>Testing Instructions:</h4>
        <ol>
          <li>Click "Start Quiz Now"</li>
          <li>Open student page in another tab/browser</li>
          <li>Join with different student names</li>
          <li>Verify all students see same question at same time</li>
          <li>Try joining late to test missed questions</li>
        </ol>
      </div>
    </div>
  );
};

export default TestAdminPanel;