import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import Home from './pages/Home';
import { QuizProvider } from './contexts/QuizContext';
import { AlertProvider } from './contexts/AlertContext'; // Add this import
import { initializeActiveQuiz } from './utils/firestore';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  useEffect(() => {
    initializeActiveQuiz();
  }, []);

  return (
    <AlertProvider> {/* Add AlertProvider here */}
      <QuizProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/student" element={<StudentPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </QuizProvider>
    </AlertProvider> 
  );
}

export default App;