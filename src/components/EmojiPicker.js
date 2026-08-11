import React from 'react';

// Reuses the avatar-picker styling so every emoji chooser in the app looks and
// behaves the same way.
const EmojiPicker = ({ value, onChange, options, label = 'Pick an icon' }) => (
  <div className="form-group">
    <label>{label}</label>
    <div className="avatar-picker">
      {options.map(emoji => (
        <button
          key={emoji}
          type="button"
          className={`avatar-option ${value === emoji ? 'selected' : ''}`}
          onClick={() => onChange(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  </div>
);

export default EmojiPicker;
