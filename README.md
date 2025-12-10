# Cheer Merit Tracker

A ClassDojo-style merit and demerit tracking system specifically designed for cheer coaches, cheerleaders, and parents.

## Features

### For Coaches
- **Squad Management**: Add, edit, and remove cheerleaders with custom avatars
- **Merit/Demerit System**: Award or deduct points with pre-configured categories
- **Leaderboard**: View squad rankings based on total points
- **Activity Feed**: Track all point changes with timestamps and notes
- **Announcements**: Post team-wide announcements
- **Parent Codes**: Auto-generated codes for parent access

### For Cheerleaders
- **Progress Tracking**: View personal point totals and history
- **Squad Leaderboard**: See how you rank among teammates
- **Weekly Stats**: Track weekly point changes
- **Team Announcements**: Stay updated with coach communications

### For Parents
- **Child Monitoring**: View your child's merit/demerit history
- **Progress Overview**: See total points, ranking, and weekly changes
- **Point Breakdown**: Visual breakdown of merits vs demerits
- **Coach Communication**: Send messages to the coach
- **Announcements**: View team announcements

## Merit Categories
- Great Attitude (+2)
- On Time (+1)
- Worked Hard (+2)
- Helped Teammate (+2)
- Nailed Routine (+3)
- Showed Leadership (+3)
- Positive Energy (+2)
- Improved Skill (+2)
- Encouraged Others (+2)
- Extra Effort (+3)

## Demerit Categories
- Late to Practice (-2)
- Unprepared (-1)
- Disrespectful (-3)
- Not Trying (-2)
- Talking Back (-2)
- Distracted (-1)
- Negative Attitude (-2)
- Missed Practice (-3)
- Unsafe Behavior (-3)
- Uniform Violation (-1)

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

**Parent Codes** (for testing):
- EMMA2024
- SOPHIA2024
- OLIVIA2024
- AVA2024
- ISABELLA2024

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
    AppContext.js       # Global state management
  components/
    CheerleaderCard.js  # Individual cheerleader display
    AddCheerleaderModal.js
    PointModal.js       # Merit/demerit selection
    RecentActivity.js   # Activity feed
    AnnouncementSection.js
  pages/
    LoginPage.js        # Role selection & login
    CoachDashboard.js   # Coach interface
    CheerleaderDashboard.js
    ParentDashboard.js
  data/
    defaultCategories.js # Merit/demerit definitions
```

## Building for Production

```bash
npm run build
```

Builds the app for production to the `build` folder.
