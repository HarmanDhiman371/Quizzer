import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleStudentQuiz = () => {
    navigate('/student');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      navigate('/admin');
    } else {
      alert('Invalid admin password!');
    }
  };

  return (
    <div className="homepage">
      <div className="container">
        {/* Animated Background Elements */}
        <div className="background-elements">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>

        {/* Header */}
        <header className={`header ${isVisible ? 'fade-in-up' : ''}`}>
          <div className="logo">
            <div className="logo-icon">🎯</div>
            <h1>Quiz Platform</h1>
          </div>
          <p className="tagline">Interactive Learning Platform</p>
        </header>

        {/* Main Content */}
        <main className="main-content">
          <div className={`welcome-card ${isVisible ? 'slide-up' : ''}`}>
            <div className="card-header">
              <h2>Welcome to EBI Quiz Platform</h2>
              <p>Join interactive quizzes or manage them as admin</p>
            </div>
            
            <div className="button-section">
              {!showAdminLogin ? (
                <div className="button-group">
                  <button 
                    onClick={handleStudentQuiz}
                    className="btn btn-primary pulse-hover"
                  >
                    <span className="btn-icon">🎯</span>
                    <span className="btn-text">Take Quiz</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowAdminLogin(true);
                      setAdminPassword(''); // Clear password when opening admin login
                    }}
                    className="btn btn-secondary slide-hover"
                  >
                    <span className="btn-icon">🔧</span>
                    <span className="btn-text">Admin Panel</span>
                  </button>
                </div>
              ) : (
                <div className="admin-login fade-in">
                  <h3>Admin Access</h3>
                  <div className="input-container">
                    <input
                      type="password"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="password-input"
                      onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                      autoFocus // Auto focus on input when admin login opens
                    />
                  </div>
                  <div className="login-buttons">
                    <button 
                      onClick={handleAdminLogin} 
                      className="btn btn-primary"
                      disabled={!adminPassword.trim()} // Disable if empty
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => {
                        setShowAdminLogin(false);
                        setAdminPassword(''); // Clear password when going back
                      }} 
                      className="btn btn-outline"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={`footer ${isVisible ? 'fade-in' : ''}`}>
          <p>© 2024 Quiz Platform</p>
        </footer>
      </div>

      <style jsx>{`
        .homepage {
          min-height: 100vh;
          background: linear-gradient(135deg, #03045e 0%, #023e8a 50%, #0077b6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .background-elements {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .floating-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: float 6s ease-in-out infinite;
        }

        .circle-1 {
          width: 80px;
          height: 80px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .circle-2 {
          width: 120px;
          height: 120px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .circle-3 {
          width: 60px;
          height: 60px;
          bottom: 20%;
          left: 20%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        .container {
          width: 100%;
          max-width: 480px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .header {
          margin-bottom: 50px;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease;
        }

        .header.fade-in-up {
          opacity: 1;
          transform: translateY(0);
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .logo-icon {
          font-size: 3.5rem;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .logo h1 {
          font-size: 2.8rem;
          color: white;
          margin: 0;
          font-weight: 700;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        .tagline {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.2rem;
          margin: 0;
          font-weight: 300;
          letter-spacing: 0.5px;
        }

        .main-content {
          margin-bottom: 40px;
        }

        .welcome-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 50px 40px;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.2);
          transform: translateY(50px);
          opacity: 0;
          transition: all 0.8s ease 0.3s;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .welcome-card.slide-up {
          opacity: 1;
          transform: translateY(0);
        }

        .card-header {
          margin-bottom: 40px;
        }

        .welcome-card h2 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 2rem;
          font-weight: 600;
        }

        .welcome-card p {
          color: #6c757d;
          margin: 0;
          font-size: 1.1rem;
          line-height: 1.5;
        }

        .button-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .btn {
          padding: 18px 30px;
          border: none;
          border-radius: 15px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(52, 152, 219, 0.4);
        }

        .btn-secondary {
          background: linear-gradient(135deg, #5dade2, #3498db);
          color: white;
          box-shadow: 0 8px 25px rgba(93, 173, 226, 0.3);
        }

        .btn-secondary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(93, 173, 226, 0.4);
        }

        .btn-outline {
          background: transparent;
          color: #3498db;
          border: 2px solid #3498db;
        }

        .btn-outline:hover {
          background: rgba(52, 152, 219, 0.1);
          transform: translateY(-2px);
        }

        .pulse-hover:hover {
          animation: pulse 1s infinite;
        }

        .slide-hover:hover {
          transform: translateX(5px) translateY(-2px);
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .btn-icon {
          font-size: 1.3rem;
        }

        .btn-text {
          flex: 1;
        }

        .admin-login {
          text-align: center;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .admin-login h3 {
          color: #2c3e50;
          margin-bottom: 25px;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .input-container {
          margin-bottom: 25px;
        }

        .password-input {
          width: 80%;
          padding: 18px 20px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 1rem;
          text-align: center;
          transition: all 0.3s ease;
          background: #f8f9fa;
          color: #2c3e50;
        }

        .password-input:focus {
          outline: none;
          border-color: #3498db;
          background: white;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
          transform: scale(1.02);
        }

        .password-input::placeholder {
          color: #a0a0a0;
        }

        .login-buttons {
          display: flex;
          gap: 12px;
        }

        .login-buttons .btn {
          flex: 1;
        }

        .footer {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          opacity: 0;
          transition: all 0.8s ease 0.6s;
        }

        .footer.fade-in {
          opacity: 1;
        }

        /* Responsive Design */
        @media (max-width: 480px) {
          .homepage {
            padding: 15px;
          }

          .container {
            max-width: 100%;
          }

          .welcome-card {
            padding: 40px 25px;
            border-radius: 20px;
          }

          .logo h1 {
            font-size: 2.2rem;
          }

          .logo-icon {
            font-size: 3rem;
          }

          .tagline {
            font-size: 1.1rem;
          }

          .welcome-card h2 {
            font-size: 1.7rem;
          }

          .btn {
            padding: 16px 25px;
            font-size: 1rem;
          }

          .floating-circle {
            display: none;
          }
        }

        @media (max-width: 360px) {
          .welcome-card {
            padding: 30px 20px;
          }

          .logo {
            flex-direction: column;
            gap: 10px;
          }

          .login-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;