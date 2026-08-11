# Cheer Merit Tracker — Mobile

React Native (Expo) app for iPhone, backed by Firebase (Authentication + Firestore) for real
accounts and cross-device persistence. Ported from the web app in `../src`, which is left
untouched for reference/continued browser use.

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com and create a new project (or reuse an existing one).
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → Create database → production mode → pick a nearby region.
4. **Project settings** (gear icon) → General → "Your apps" → Add app → Web (`</>`) → register
   an app (nickname doesn't matter, no hosting needed) → copy the `firebaseConfig` values.

## 2. Configure the app

```bash
cd mobile
cp .env.example .env
```

Fill in `.env` with the values from step 1 (`apiKey`, `authDomain`, `projectId`,
`storageBucket`, `messagingSenderId`, `appId`). These are safe to ship in the client — actual
security is enforced by `firestore.rules` and Firebase Auth, not by hiding this config.

## 3. Deploy Firestore security rules

```bash
npm install -g firebase-tools   # if you don't have it
firebase login
firebase use --add              # pick your Firebase project
firebase deploy --only firestore:rules
```

## 4. Run it on your iPhone

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (free on the App Store) on your iPhone. No Mac,
Xcode, or Apple Developer account needed for this — Expo Go runs the app live from your
computer.

## Data model

Firestore is multi-tenant: every coach who signs up creates their own `squads/{squadId}`
document with an invite code. Cheerleaders and parents join a squad using that invite code
(cheerleaders also pick their name from the roster; parents also enter their child's
parent code), and everyone gets their own Firebase Auth account.

```
users/{uid}                             { role, squadId, linkedCheerleaderId?, displayName, email }
squads/{squadId}                        { name, coachId, inviteCode, createdAt }
squads/{squadId}/cheerleaders/{id}      { name, avatar, totalPoints, parentCode, createdAt }
squads/{squadId}/pointHistory/{id}      { cheerleaderId, category, points, isMerit, note, timestamp, awardedByUid, awardedByName }
squads/{squadId}/categories/{id}        { name, points, icon, isMerit }
squads/{squadId}/announcements/{id}     { title, content, timestamp, authorId, authorName }
squads/{squadId}/messages/{id}          { fromId, fromName, fromRole, toId, content, timestamp, read }
```

## Next phase: Apple App Store

Once the app is working and tested on your phone:

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/yr).
2. Design real app icon/splash assets (replace the placeholders in `assets/`).
3. Set up `eas.json` build profiles and run `eas build --platform ios`.
4. Submit the build to TestFlight for testing, then to App Store Connect for review via
   `eas submit`.

None of this is needed to use the app on your own phone via Expo Go — it's only required to
distribute the app publicly.
