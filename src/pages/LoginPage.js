import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginAsCoach, loginAsCheerleader, loginAsParent, cheerleaders } = useApp();
  const [selectedRole, setSelectedRole] = useState(null);
  const [coachName, setCoachName] = useState('');
  const [selectedCheerleader, setSelectedCheerleader] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [error, setError] = useState('');

  const handleCoachLogin = (e) => {
    e.preventDefault();
    if (coachName.trim()) {
      loginAsCoach(coachName);
      navigate('/coach');
    }
  };

  const handleCheerleaderLogin = (e) => {
    e.preventDefault();
    if (selectedCheerleader) {
      loginAsCheerleader(selectedCheerleader);
      navigate('/cheerleader');
    }
  };

  const handleParentLogin = (e) => {
    e.preventDefault();
    const success = loginAsParent(parentCode.toUpperCase());
    if (success) {
      navigate('/parent');
    } else {
      setError('Invalid parent code. Please check and try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>📣 Cheer Merit Tracker</h1>
          <p>Track merits and demerits for your cheer squad</p>
        </div>

        {!selectedRole ? (
          <div className="role-selection">
            <h2>I am a...</h2>
            <div className="role-buttons">
              <button
                className="role-btn coach-btn"
                onClick={() => setSelectedRole('coach')}
              >
                <span className="role-icon">🏆</span>
                <span className="role-title">Coach</span>
                <span className="role-desc">Manage team & award points</span>
              </button>

              <button
                className="role-btn cheerleader-btn"
                onClick={() => setSelectedRole('cheerleader')}
              >
                <span className="role-icon">📣</span>
                <span className="role-title">Cheerleader</span>
                <span className="role-desc">View my progress</span>
              </button>

              <button
                className="role-btn parent-btn"
                onClick={() => setSelectedRole('parent')}
              >
                <span className="role-icon">👨‍👩‍👧</span>
                <span className="role-title">Parent</span>
                <span className="role-desc">Monitor my child</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="login-form-container">
            <button className="back-btn" onClick={() => { setSelectedRole(null); setError(''); }}>
              ← Back to role selection
            </button>

            {selectedRole === 'coach' && (
              <form onSubmit={handleCoachLogin} className="login-form">
                <h2>🏆 Coach Login</h2>
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <button type="submit" className="submit-btn">
                  Enter as Coach
                </button>
              </form>
            )}

            {selectedRole === 'cheerleader' && (
              <form onSubmit={handleCheerleaderLogin} className="login-form">
                <h2>📣 Cheerleader Login</h2>
                <div className="form-group">
                  <label>Select Your Name</label>
                  <select
                    value={selectedCheerleader}
                    onChange={(e) => setSelectedCheerleader(e.target.value)}
                    required
                  >
                    <option value="">-- Select --</option>
                    {cheerleaders.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.avatar} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="submit-btn">
                  View My Progress
                </button>
              </form>
            )}

            {selectedRole === 'parent' && (
              <form onSubmit={handleParentLogin} className="login-form">
                <h2>👨‍👩‍👧 Parent Login</h2>
                <div className="form-group">
                  <label>Parent Access Code</label>
                  <input
                    type="text"
                    value={parentCode}
                    onChange={(e) => { setParentCode(e.target.value); setError(''); }}
                    placeholder="Enter your parent code"
                    required
                  />
                  <small>Your code was provided by the coach</small>
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button type="submit" className="submit-btn">
                  View My Child's Progress
                </button>
              </form>
            )}
          </div>
        )}

        <div className="demo-info">
          <p><strong>Demo Parent Codes:</strong> EMMA2024, SOPHIA2024, OLIVIA2024, AVA2024, ISABELLA2024</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
