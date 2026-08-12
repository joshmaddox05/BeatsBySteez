import React from 'react';

const isSameLocalDay = (timestamp, reference) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
};

const CoachStatHeader = ({ cheerleaders, pointHistory, currentSeason }) => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const seasonHistory = pointHistory.filter(h => h.seasonId === currentSeason.id);
  const thisWeek = seasonHistory.filter(h => new Date(h.timestamp) >= weekAgo);
  const meritsThisWeek = thisWeek
    .filter(h => h.isMerit)
    .reduce((sum, h) => sum + (h.points || 0), 0);
  const demeritsThisWeek = thisWeek
    .filter(h => !h.isMerit)
    .reduce((sum, h) => sum + (h.points || 0), 0);
  const awardsToday = seasonHistory.filter(h => isSameLocalDay(h.timestamp, now)).length;

  const leader = [...cheerleaders].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))[0];

  return (
    <div className="coach-stat-header">
      <div className="coach-stat-tile">
        <span className="value">{cheerleaders.length}</span>
        <span className="label">On the squad</span>
      </div>
      <div className="coach-stat-tile">
        <span className="value positive">+{meritsThisWeek}</span>
        <span className="label">Merits this week</span>
      </div>
      <div className="coach-stat-tile">
        <span className="value negative">{demeritsThisWeek}</span>
        <span className="label">Demerits this week</span>
      </div>
      <div className="coach-stat-tile">
        <span className="value">{awardsToday}</span>
        <span className="label">Awards today</span>
      </div>
      <div className="coach-stat-tile">
        <span className="value leader">
          {leader ? `${leader.avatar} ${leader.name.split(' ')[0]}` : '—'}
        </span>
        <span className="label">
          {leader ? `Leading with ${leader.totalPoints || 0}` : 'No cheerleaders yet'}
        </span>
      </div>
      <div className="coach-stat-tile season">
        <span className="season-chip">{currentSeason.name}</span>
        <span className="label">{seasonHistory.length} awards this season</span>
      </div>
    </div>
  );
};

export default CoachStatHeader;
