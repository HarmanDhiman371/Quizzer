import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate  } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import Home from './pages/Home';
import { QuizProvider } from './contexts/QuizContext';
import { initializeActiveQuiz } from './utils/firestore';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize Firebase active quiz document
    initializeActiveQuiz();
  }, []);

  return (
    <QuizProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/student" element={<StudentPage />} />
             <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </QuizProvider>
  );
}

export default App;