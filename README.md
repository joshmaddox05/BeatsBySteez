# Cheer Merit Tracker

A ClassDojo-style merit and demerit tracking system specifically designed for cheer coaches, cheerleaders, and parents.

## Features

### For Coaches
- **Squad Management**: Add cheerleaders, edit their name, avatar, position, level and private
  coach notes, and regenerate their parent code
- **Your Own Point System**: Create, rename, retune, reorder and delete merit and demerit
  categories, or load one of five preset packs as a starting point and edit from there
- **Squad Groups**: Organize the squad into groups (Varsity, JV, stunt groups), filter by
  group, and award a whole group at once
- **Bulk Awarding**: Select several cheerleaders and give them all the same merit or demerit,
  with a per-cheerleader result summary
- **Squad Rules**: Allow or forbid negative totals, require a note on demerits, and cap how
  many points one cheerleader can be given per day
- **Reward Tiers**: Define named levels (e.g. 50 pts = Spirit Star) that show on cards and in
  the cheerleader and parent views
- **Seasons**: Archive the current standings and reset everyone to 0 for a new season, without
  deleting any history
- **Leaderboard**: Squad rankings, filterable by group
- **Activity Feed**: All point changes with timestamps and notes, scoped by season or group
- **Parent Inbox**: Read and reply to parent messages
- **Announcements**: Post team-wide announcements

### For Cheerleaders
- **Progress Tracking**: View personal point totals and history
- **Reward Level**: See the level you've reached and how far to the next one
- **Squad Leaderboard**: See how you rank among teammates
- **Weekly Stats**: Track weekly point changes
- **Team Announcements**: Stay updated with coach communications

### For Parents
- **Child Monitoring**: View your child's merit/demerit history
- **Progress Overview**: See total points, ranking, reward level, and weekly changes
- **Point Breakdown**: Visual breakdown of merits vs demerits
- **Coach Communication**: Send messages to the coach and read replies
- **Announcements**: View team announcements

## The Point System

Categories are fully owned by the coach — everything below is a starting point that can be
renamed, revalued, reordered, deleted, or replaced from Settings → Categories. Point values
range 1–10 out of the box.

**Merits**: Great Attitude (+5) · On Time (+2) · Worked Hard (+6) · Helped Teammate (+5) ·
Nailed Routine (+10) · Showed Leadership (+8) · Positive Energy (+4) · Improved Skill (+7) ·
Encouraged Others (+4) · Extra Effort (+8)

**Demerits**: Late to Practice (-5) · Unprepared (-3) · Disrespectful (-10) · Not Trying (-6) ·
Talking Back (-7) · Distracted (-2) · Negative Attitude (-5) · Missed Practice (-8) ·
Unsafe Behavior (-10) · Uniform Violation (-2)

**Preset packs**: Classic Cheer, Competition Season, Tumbling & Skills, Attitude & Teamwork,
Strict Discipline. Loading a pack either replaces the current list or adds alongside it.

Past awards store a snapshot of the category they were given as, so editing or deleting a
category never rewrites history.

## Getting Started

### Installation

```bash
npm install
```

### Running the App

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Demo Credentials

**Coach**: Enter any name to login as a coach

**Cheerleader**: Select from the pre-loaded cheerleaders

**Parent Codes**: the login screen lists the current codes for the loaded squad. The demo squad
ships with EMMA2024, SOPHIA2024, OLIVIA2024, AVA2024 and ISABELLA2024; codes change when the
coach adds a cheerleader or regenerates a code.

To start over from the demo squad at any time, use **Reset Demo** in the coach header.

## Tech Stack

- **React 18** - UI framework
- **React Router** - Navigation
- **Context API** - State management
- **LocalStorage** - Data persistence
- **CSS3** - Styling with CSS variables and responsive design

## Project Structure

```
src/
  contexts/
    AppContext.js            # Global state, awarding rules, all mutations
  components/
    CheerleaderCard.js       # Individual cheerleader display
    AddCheerleaderModal.js
    EditCheerleaderModal.js  # Profile, groups, parent code
    PointModal.js            # Single merit/demerit award
    BulkAwardModal.js        # Award several cheerleaders at once
    RecentActivity.js        # Activity feed
    AnnouncementSection.js
    MessageInbox.js          # Coach side of parent messaging
    CoachStatHeader.js       # Squad-at-a-glance tiles
    SquadToolbar.js          # Search, sort, group filter, selection
    TierBadge.js             # Reward level badge
    TierProgress.js          # Reward level + progress to next
    EmojiPicker.js           # Shared emoji chooser
    CategoryEditorModal.js   # Create/edit one point category
    settings/
      SettingsPanel.js       # Coach settings shell (sub-tabs)
      CategorySettings.js    # Category CRUD + preset packs
      TierSettings.js        # Reward tier CRUD
      GroupSettings.js       # Group CRUD + membership
      RulesSettings.js       # Squad-wide awarding rules
      SeasonSettings.js      # Season rollover + archives
  pages/
    LoginPage.js             # Role selection & login
    CoachDashboard.js        # Coach interface
    CheerleaderDashboard.js
    ParentDashboard.js
  data/
    persistence.js           # localStorage load/save + schema migration
    defaultCategories.js     # Default categories, rules, demo squad
    defaultRewardTiers.js
    presetPacks.js           # Five starter category packs
    emojiOptions.js          # Emoji palettes + group colors
```

### Data & persistence

All state lives in `AppContext` and persists to localStorage, one key per slice. `persistence.js`
loads and normalizes everything once before first paint, and migrates data saved by older
versions of the app (`schemaVersion`) — including backfilling a category snapshot onto award
history that predates it. Unreadable keys are discarded rather than crashing the app.

## Building for Production

```bash
npm run build
```

Builds the app for production to the `build` folder.
