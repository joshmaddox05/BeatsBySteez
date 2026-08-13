import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { colors } from '../theme/colors';
import EmojiPicker from './EmojiPicker';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const EVENT_ICONS = ['📅', '🏆', '🎉', '🚌', '🎤', '🤸', '🎽', '🩰'];

const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDateStr = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatMonthYear = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const formatDayLabel = (s) =>
  parseDateStr(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

// Builds a 7-wide grid, padded with null cells so the first real day lands on
// its correct weekday column and every row stays a full week.
const buildMonthGrid = (viewMonth) => {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, dateStr: toDateStr(new Date(year, month, day)) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

const TeamCalendar = ({ isCoach = false }) => {
  const { events, addEvent, removeEvent } = useApp();
  const today = useMemo(() => new Date(), []);
  const todayStr = toDateStr(today);

  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(EVENT_ICONS[0]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date).push(e);
    });
    map.forEach((list) => list.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    return map;
  }, [events]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => e.date >= todayStr)
        .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
        .slice(0, 5),
    [events, todayStr]
  );

  const weeks = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const selectedDayEvents = eventsByDate.get(selectedDate) || [];

  const changeMonth = (delta) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const selectDay = (dateStr) => {
    setSelectedDate(dateStr);
    setShowForm(false);
  };

  const jumpTo = (dateStr) => {
    const d = parseDateStr(dateStr);
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(dateStr);
  };

  const resetForm = () => {
    setTitle('');
    setTime('');
    setLocation('');
    setDescription('');
    setIcon(EVENT_ICONS[0]);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    addEvent({
      title: title.trim(),
      date: selectedDate,
      time: time.trim(),
      location: location.trim(),
      description: description.trim(),
      icon,
    });
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (eventId) => {
    Alert.alert('Delete event', 'Remove this event from the calendar?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEvent(eventId) },
    ]);
  };

  return (
    <View>
      {upcomingEvents.length > 0 && (
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionLabel}>Upcoming</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.upcomingRow}>
            {upcomingEvents.map((e) => (
              <TouchableOpacity key={e.id} style={styles.upcomingCard} onPress={() => jumpTo(e.date)}>
                <Text style={styles.upcomingIcon}>{e.icon || '📅'}</Text>
                <Text style={styles.upcomingTitle} numberOfLines={1}>
                  {e.title}
                </Text>
                <Text style={styles.upcomingDate}>{formatDayLabel(e.date)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
          <Text style={styles.monthNavText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{formatMonthYear(viewMonth)}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
          <Text style={styles.monthNavText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((cell, ci) => {
            if (!cell) return <View key={ci} style={styles.dayCell} />;
            const hasEvents = eventsByDate.has(cell.dateStr);
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            return (
              <TouchableOpacity
                key={ci}
                style={[
                  styles.dayCell,
                  isToday && !isSelected && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => selectDay(cell.dateStr)}
              >
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{cell.day}</Text>
                {hasEvents && <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={styles.selectedHeader}>
        <Text style={styles.selectedTitle}>{formatDayLabel(selectedDate)}</Text>
        {isCoach && (
          <TouchableOpacity onPress={() => setShowForm((s) => !s)}>
            <Text style={styles.addLink}>{showForm ? 'Cancel' : '+ Add event'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && isCoach && (
        <View style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Event title" />
          <Text style={styles.label}>Time (optional)</Text>
          <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="e.g. 6:00 PM" />
          <Text style={styles.label}>Location (optional)</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Main gym" />
          <Text style={styles.label}>Details (optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="More info for the team..."
            multiline
          />
          <EmojiPicker value={icon} onChange={setIcon} options={EVENT_ICONS} label="Icon" />
          <TouchableOpacity
            style={[styles.submitBtn, !title.trim() && styles.disabled]}
            onPress={handleSubmit}
            disabled={!title.trim()}
          >
            <Text style={styles.submitBtnText}>Add to Calendar</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedDayEvents.length === 0 ? (
        <Text style={styles.emptyText}>No events on this day.</Text>
      ) : (
        selectedDayEvents.map((e) => (
          <View key={e.id} style={styles.eventCard}>
            <View style={styles.eventCardHeader}>
              <Text style={styles.eventCardIcon}>{e.icon || '📅'}</Text>
              <View style={styles.eventCardInfo}>
                <Text style={styles.eventCardTitle}>{e.title}</Text>
                {!!(e.time || e.location) && (
                  <Text style={styles.eventCardMeta}>
                    {[e.time, e.location].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              {isCoach && (
                <TouchableOpacity onPress={() => handleDelete(e.id)}>
                  <Text style={styles.deleteBtn}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            {!!e.description && <Text style={styles.eventCardDesc}>{e.description}</Text>}
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionLabel: { fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  upcomingSection: { marginBottom: 16 },
  upcomingRow: { paddingRight: 8 },
  upcomingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginRight: 8,
    width: 110,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upcomingIcon: { fontSize: 20, marginBottom: 4 },
  upcomingTitle: { fontWeight: '700', color: colors.textPrimary, fontSize: 12 },
  upcomingDate: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthNavBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  monthNavText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  monthTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  weekRow: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellToday: { borderWidth: 1, borderColor: colors.primary },
  dayCellSelected: { backgroundColor: colors.primary },
  dayNumber: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  dayNumberSelected: { color: '#fff' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.secondary, marginTop: 3 },
  dayDotSelected: { backgroundColor: '#fff' },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  selectedTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  addLink: { color: colors.primary, fontWeight: '700' },
  form: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 14 },
  label: { fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10 },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  eventCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10 },
  eventCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  eventCardIcon: { fontSize: 22, marginRight: 10 },
  eventCardInfo: { flex: 1 },
  eventCardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  eventCardMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  deleteBtn: { fontSize: 20, color: colors.textSecondary, marginLeft: 8 },
  eventCardDesc: { color: colors.textPrimary, marginTop: 8 },
});

export default TeamCalendar;
