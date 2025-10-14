import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container">
      <div className="home-page">
        <header className="hero-section">
          <h1>🎯 Synchronized Quiz System</h1>
          <p>Test the real-time quiz synchronization</p>
        </header>
        
        <div className="navigation-cards">
          <div className="nav-card">
            <h3>👨‍💼 Admin Panel</h3>
            <p>Start and manage quizzes</p>
            <Link to="/admin" className="btn btn-primary">
              Go to Admin Panel
            </Link>
          </div>
          
          <div className="nav-card">
            <h3>👨‍🎓 Student Interface</h3>
            <p>Take quizzes in real-time</p>
            <Link to="/quiz" className="btn btn-success">
              Go to Student Quiz
            </Link>
          </div>
        </div>

        <div className="features">
          <h3>✨ Features Being Tested:</h3>
          <ul>
            <li>✅ Real-time question synchronization</li>
            <li>✅ Automatic question progression</li>
            <li>✅ Late joiner handling</li>
            <li>✅ Mobile-responsive design</li>
            <li>✅ Auto-save answers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;