import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';  // Use AdminPage
import StudentPage from './pages/StudentPage';
import Home from './pages/Home';
import { QuizProvider } from './contexts/QuizContext';
import { initializeActiveQuiz } from './utils/firestore';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  useEffect(() => {
    initializeActiveQuiz();
  }, []);

  return (
    <QuizProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPage />  {/* Use AdminPage here */}
                </ProtectedRoute>
              } 
            />
            <Route path="/student" element={<StudentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </QuizProvider>
  );
}

export default App;