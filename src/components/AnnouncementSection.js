import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const AnnouncementSection = ({ isCoach = false }) => {
  const { announcements, addAnnouncement, removeAnnouncement } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      addAnnouncement(title.trim(), content.trim());
      setTitle('');
      setContent('');
      setShowForm(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="announcement-section">
      {isCoach && (
        <div className="announcement-actions">
          <h2>📢 Team Announcements</h2>
          <button
            className="add-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ New Announcement'}
          </button>
        </div>
      )}

      {showForm && isCoach && (
        <form className="announcement-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              required
            />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            Post Announcement
          </button>
        </form>
      )}

      <div className="announcements-list">
        {announcements.length === 0 ? (
          <div className="no-announcements">
            <p>No announcements yet.</p>
            {isCoach && <p>Create one to share news with your team!</p>}
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-card">
              <div className="announcement-header">
                <h3>{announcement.title}</h3>
                {isCoach && (
                  <button
                    className="delete-btn"
                    onClick={() => removeAnnouncement(announcement.id)}
                    title="Delete announcement"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="announcement-content">{announcement.content}</p>
              <div className="announcement-meta">
                <span className="author">Posted by {announcement.author}</span>
                <span className="date">{formatDate(announcement.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementSection;
