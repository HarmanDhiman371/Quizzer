import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizCreator from './QuizCreator';
import QuizManager from './QuizManager';
import LiveMonitor from './LiveMonitor';
import ResultsManager from './ResultsManager';
import { useQuiz } from '../../contexts/QuizContext';
import "./admin.css"

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { activeQuiz } = useQuiz();

  // Auto-switch to live monitor when quiz becomes active
  useEffect(() => {
    if (activeQuiz && (activeQuiz.status === 'active' || activeQuiz.status === 'waiting')) {
      setActiveTab('live');
    }
  }, [activeQuiz]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/');
  };

  const tabs = [
    { id: 'create', label: 'Create Quiz', icon: '📝', color: '#007bff' },
    { id: 'manage', label: 'Manage Quizzes', icon: '📚', color: '#28a745' },
    { id: 'live', label: 'Live Monitor', icon: '📊', color: '#dc3545' },
    { id: 'results', label: 'Class Results', icon: '🏆', color: '#ffc107' }
  ];

  const getActiveTabColor = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    return activeTabConfig ? activeTabConfig.color : '#007bff';
  };

  return (
    <div className="admin-panel">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="modal-header">
              <h3>Confirm Logout</h3>
              <div className="modal-icon">🚪</div>
            </div>
            <p>Are you sure you want to logout from admin panel?</p>
            <div className="modal-actions">
              <button 
                className="btn btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-logout-confirm"
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
        <div className="mobile-title">
          <span className="admin-icon">👑</span>
          Admin Panel
        </div>
        {activeQuiz && (activeQuiz.status === 'active' || activeQuiz.status === 'waiting') && (
          <div className="live-indicator-mobile">
            <span className="live-dot"></span>
            {activeQuiz.status === 'waiting' ? 'STARTING' : 'LIVE'}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-brand">
            <div className="brand-icon">👑</div>
            <div className="brand-text">
              <h2>EBI Quiz</h2>
              <p>Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              style={{
                '--active-color': tab.color
              }}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
              {tab.id === 'live' && activeQuiz && (activeQuiz.status === 'active' || activeQuiz.status === 'waiting') && (
                <span className="live-badge"></span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="quiz-status-card">
            {activeQuiz ? (
              <>
                <div className="status-header">
                  <span className={`status-dot ${activeQuiz.status === 'active' ? 'live' : 'waiting'}`}></span>
                  <span>{activeQuiz.status === 'waiting' ? 'Starting Soon' : 'Active Quiz'}</span>
                </div>
                <p className="quiz-name">{activeQuiz.name}</p>
                <p className="quiz-class">{activeQuiz.class}</p>
                {activeQuiz.status === 'waiting' && activeQuiz.quizStartTime && (
                  <p className="countdown">
                    Starts in: {Math.ceil((activeQuiz.quizStartTime - Date.now()) / 1000)}s
                  </p>
                )}
              </>
            ) : (
              <div className="no-active-quiz">
                <span className="status-dot idle"></span>
                <span>No Active Quiz</span>
              </div>
            )}
          </div>

          {/* Logout Button in Sidebar */}
          <button 
            className="logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <div className="header-left">
            <h1 style={{ color: getActiveTabColor() }}>
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h1>
            <p className="header-subtitle">
              {activeTab === 'create' && 'Create and schedule new quizzes'}
              {activeTab === 'manage' && 'Manage scheduled quizzes and start them'}
              {activeTab === 'live' && 'Monitor live quiz sessions in real-time'}
              {activeTab === 'results' && 'View class-wise top 5 rankings'}
            </p>
          </div>
          
          <div className="header-right">
            {/* Desktop Logout Button */}
            <button 
              className="desktop-logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Logout</span>
            </button>
            
            {activeTab === 'live' && activeQuiz && (
              <div className="live-quick-stats">
                <div className="quick-stat">
                  <span className="stat-value">{activeQuiz.questions?.length || 0}</span>
                  <span className="stat-label">Questions</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-value">{activeQuiz.timePerQuestion}s</span>
                  <span className="stat-label">Per Q</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-value">
                    {activeQuiz.status === 'waiting' ? 'Waiting' : 'Active'}
                  </span>
                  <span className="stat-label">Status</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="content-area">
          {activeTab === 'create' && <QuizCreator />}
          {activeTab === 'manage' && <QuizManager />}
          {activeTab === 'live' && <LiveMonitor />}
          {activeTab === 'results' && <ResultsManager />}
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminPanel;