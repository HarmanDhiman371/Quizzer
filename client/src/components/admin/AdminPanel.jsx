import React, { useState } from 'react';
import QuizCreator from './QuizCreator';
import QuizManager from './QuizManager';
import LiveMonitor from './LiveMonitor';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('create');

  const tabs = [
    { id: 'create', label: '📝 Create Quiz', icon: '📝' },
    { id: 'manage', label: '📚 Manage Quizzes', icon: '📚' },
    { id: 'live', label: '📊 Live Monitor', icon: '📊' }
  ];

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🎯 Quiz Admin Panel</h1>
        <p>Create, schedule, and monitor quizzes in real-time</p>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === 'create' && <QuizCreator />}
        {activeTab === 'manage' && <QuizManager />}
        {activeTab === 'live' && <LiveMonitor />}
      </div>
    </div>
  );
};

export default AdminPanel;