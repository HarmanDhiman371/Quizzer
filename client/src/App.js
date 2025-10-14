import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
            <Route path="/quiz" element={<StudentPage />} />
          </Routes>
        </div>
      </Router>
    </QuizProvider>
  );
}

export default App;