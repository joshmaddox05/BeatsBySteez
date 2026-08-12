import React, { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';

const COACH_ID = 'coach';

const formatTime = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MessageInbox = () => {
  const { messages, cheerleaders, sendMessage, markThreadAsRead } = useApp();
  const [openThreadId, setOpenThreadId] = useState(null);
  const [reply, setReply] = useState('');

  // Parents message the coach as `parent-<childId>`, so the child's name and
  // avatar come straight off the roster — no extra data needed.
  const childFor = (counterpartId) => {
    if (!counterpartId?.startsWith('parent-')) return null;
    return cheerleaders.find(c => c.id === counterpartId.slice(7)) || null;
  };

  const threads = useMemo(() => {
    const byCounterpart = new Map();
    messages
      .filter(m => m.toId === COACH_ID || m.fromId === COACH_ID)
      .forEach(m => {
        const counterpartId = m.fromId === COACH_ID ? m.toId : m.fromId;
        if (!counterpartId) return;
        if (!byCounterpart.has(counterpartId)) {
          byCounterpart.set(counterpartId, {
            counterpartId,
            counterpartName: m.fromId === COACH_ID ? counterpartId : m.fromName,
            messages: [],
            unread: 0,
          });
        }
        const thread = byCounterpart.get(counterpartId);
        thread.messages.push(m);
        if (m.toId === COACH_ID && !m.read) thread.unread += 1;
        if (m.fromId !== COACH_ID && m.fromName) thread.counterpartName = m.fromName;
      });

    return [...byCounterpart.values()]
      .map(thread => ({
        ...thread,
        messages: [...thread.messages].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        ),
      }))
      .sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.timestamp || 0;
        const bLast = b.messages[b.messages.length - 1]?.timestamp || 0;
        return new Date(bLast) - new Date(aLast);
      });
  }, [messages]);

  const openThread = threads.find(t => t.counterpartId === openThreadId) || null;

  const handleOpen = (thread) => {
    setOpenThreadId(thread.counterpartId);
    setReply('');
    if (thread.unread > 0) {
      markThreadAsRead(thread.counterpartId, COACH_ID);
    }
  };

  const handleReply = (e) => {
    e.preventDefault();
    if (!reply.trim() || !openThread) return;
    sendMessage(openThread.counterpartId, reply.trim());
    setReply('');
  };

  if (threads.length === 0) {
    return (
      <div className="recent-activity empty">
        <p>No messages yet. Parents can reach you from their Contact Coach tab.</p>
      </div>
    );
  }

  return (
    <div className={`inbox-layout ${openThread ? 'thread-open' : ''}`}>
      <div className="thread-list">
        {threads.map(thread => {
          const child = childFor(thread.counterpartId);
          const last = thread.messages[thread.messages.length - 1];
          return (
            <button
              key={thread.counterpartId}
              className={`thread-item ${openThreadId === thread.counterpartId ? 'active' : ''} ${
                thread.unread > 0 ? 'unread' : ''
              }`}
              onClick={() => handleOpen(thread)}
            >
              <span className="thread-avatar">{child?.avatar || '👤'}</span>
              <span className="thread-info">
                <strong>{thread.counterpartName || 'Parent'}</strong>
                <small>{last?.content}</small>
              </span>
              {thread.unread > 0 && <span className="unread-dot">{thread.unread}</span>}
            </button>
          );
        })}
      </div>

      <div className="thread-view">
        {!openThread ? (
          <p className="empty-hint">Pick a conversation to read it.</p>
        ) : (
          <>
            <div className="thread-view-header">
              <button className="back-btn" onClick={() => setOpenThreadId(null)}>
                ← Back
              </button>
              <strong>{openThread.counterpartName || 'Parent'}</strong>
              {childFor(openThread.counterpartId) && (
                <small>about {childFor(openThread.counterpartId).name}</small>
              )}
            </div>

            <ul className="thread-messages">
              {openThread.messages.map(m => (
                <li
                  key={m.id}
                  className={`message-item ${m.fromId === COACH_ID ? 'sent' : 'received'}`}
                >
                  <div className="message-header">
                    <span className="from">{m.fromId === COACH_ID ? 'You' : m.fromName}</span>
                    <span className="time">{formatTime(m.timestamp)}</span>
                  </div>
                  <p className="message-content">{m.content}</p>
                </li>
              ))}
            </ul>

            <form className="reply-form" onSubmit={handleReply}>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
              />
              <button type="submit" className="submit-btn" disabled={!reply.trim()}>
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageInbox;
