# Firebase Setup Guide for Schools

This guide helps school IT administrators and teachers set up Firebase for Truth Hunters to enable class-wide leaderboards, student-contributed claims, and achievement sharing features.

## Table of Contents

- [Overview](#overview)
- [Do I Need Firebase?](#do-i-need-firebase)
- [Prerequisites](#prerequisites)
- [Step-by-Step Setup](#step-by-step-setup)
- [Security Configuration](#security-configuration)
- [Teacher Dashboard](#teacher-dashboard)
- [Troubleshooting](#troubleshooting)
- [Cost Information](#cost-information)
- [Privacy & FERPA Compliance](#privacy--ferpa-compliance)

---

## Overview

**What is Firebase?**
Firebase is Google's cloud platform that provides a real-time database for storing class leaderboards, student achievements, and teacher-approved claims. It's free for educational use at typical classroom scales.

**What Firebase enables in Truth Hunters:**
- ✅ **Class-wide leaderboards** (multiple teams can see each other's scores)
- ✅ **Achievement sharing** (celebrate when classmates earn badges)
- ✅ **Student-contributed claims** (students submit custom claims for teacher approval)
- ✅ **Teacher dashboard** (monitor class progress, approve/reject claims)
- ✅ **Cross-session tracking** (claims seen by class won't repeat for other groups)

**What works WITHOUT Firebase:**
- ✅ **Solo and team gameplay**
- ✅ **Local leaderboards** (stored on device)
- ✅ **All 726 built-in claims**
- ✅ **Achievements and scoring**
- ✅ **Analytics and stats**

---

## Do I Need Firebase?

### You SHOULD set up Firebase if:
- You teach multiple classes/periods and want cross-class leaderboards
- You want students to submit custom claims for teacher review
- You want real-time achievement notifications across devices
- You have 2+ Chromebooks/devices used simultaneously
- You want to track class-wide statistics

### You DON'T need Firebase if:
- Students play individually on their own devices
- You only need local leaderboards (per-device tracking)
- You're using the game for a one-time lesson
- You prefer fully offline operation

**Time to set up:** 15-30 minutes (one-time setup)
**Technical skill required:** Basic (can copy/paste, follow instructions)

---

## Prerequisites

Before starting, you'll need:

1. **Google Account**
   - Gmail address (personal or school-provided)
   - Can be teacher's personal account (no student Google accounts needed)

2. **Admin access to Truth Hunters**
   - Deployed version or local installation
   - Access to Teacher Setup screen

3. **School network permissions** (if applicable)
   - Ability to access `firebase.google.com` and `firestore.googleapis.com`
   - Chromebook/device firewall may need whitelist entries

---

---

## ⚠️ Security Notice

**Current Implementation:** Teacher dashboard accessible via URL parameter (`?teacher=true`) without authentication. This is suitable for **testing and development only**.

**Before production deployment:**
- Implement Firebase Authentication (see [docs/security/README.md](security/README.md))
- Secure Firestore rules with authentication requirements
- Remove URL parameter teacher access

**Current Firestore rules:** Allow public reads and validated writes. Suitable for classroom testing with teacher supervision. Not suitable for unsupervised production use.

See [SECURITY_AUDIT_SUMMARY.md](../SECURITY_AUDIT_SUMMARY.md) for complete security documentation.

---

## Step-by-Step Setup

### Part 1: Create Firebase Project (10 minutes)

#### 1. Go to Firebase Console
- Visit [https://console.firebase.google.com](https://console.firebase.google.com)
- Sign in with your Google account

#### 2. Create a New Project
- Click **"Add project"** or **"Create a project"**
- **Project name**: `truth-hunters-[yourschoolname]`
  - Example: `truth-hunters-lincoln-middle`
  - Use lowercase, hyphens instead of spaces
- Click **"Continue"**

#### 3. Disable Google Analytics (Optional)
- Toggle **"Enable Google Analytics"** to **OFF**
  - Not needed for educational use
  - Simplifies privacy compliance
- Click **"Create project"**
- Wait 30-60 seconds for project creation

#### 4. Add a Web App
- On the project overview page, click the **</> (Web)** icon
- **App nickname**: `truth-hunters-web`
- **Do NOT** check "Also set up Firebase Hosting" (not needed)
- Click **"Register app"**

#### 5. Copy Configuration
You'll see a code block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA...",
  authDomain: "truth-hunters-xyz.firebaseapp.com",
  projectId: "truth-hunters-xyz",
  storageBucket: "truth-hunters-xyz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

- Click **"Copy to clipboard"** or manually copy the entire `firebaseConfig` object
- **Save this** in a secure location (password manager, encrypted file)
- ⚠️ **IMPORTANT**: Do NOT commit this to public GitHub repos without security rules
- Click **"Continue to console"**

---

### Part 2: Enable Firestore Database (5 minutes)

#### 1. Navigate to Firestore
- In the left sidebar, click **"Build"** → **"Firestore Database"**
- Click **"Create database"**

#### 2. Choose Security Mode
- Select **"Start in production mode"** (we'll add rules next)
- Click **"Next"**

#### 3. Choose Location
- Select a region close to your school:
  - **US**: `us-central1` (Iowa) - recommended for most US schools
  - **Europe**: `europe-west1` (Belgium)
  - **Asia**: `asia-southeast1` (Singapore)
- ⚠️ **Cannot change after creation**
- Click **"Enable"**
- Wait 1-2 minutes for database provisioning

---

### Part 3: Configure Security Rules (5 minutes)

Security rules ensure only appropriate data can be read/written.

#### 1. Open Rules Editor
- In Firestore, click the **"Rules"** tab at the top
- You'll see a text editor with default rules

#### 2. Copy Truth Hunters Security Rules
- In the Truth Hunters repository, open `firestore.rules`
- Copy the ENTIRE contents of that file
- Paste into the Firebase rules editor, replacing all existing text

#### 3. Publish Rules
- Click **"Publish"** button
- You should see "Rules published successfully"

**What these rules do:**
- ✅ Anyone in class can read leaderboards
- ✅ Students can submit scores (validated)
- ✅ Rate-limiting prevents spam (1 write per 30 seconds)
- ✅ Input validation prevents malicious data
- ✅ Team names are moderated for appropriateness

---

### Part 4: Connect Truth Hunters to Firebase (10 minutes)

#### 1. Open Truth Hunters
- Navigate to your deployed Truth Hunters site
- Or run locally: `npm run dev` → `http://localhost:3000`

#### 2. Access Teacher Setup
- At the bottom of the home screen, click **"Teacher Dashboard"** link
- Or add `?teacher=true` to the URL:
  - Example: `https://yoursite.com/?teacher=true`
  - Local: `http://localhost:3000/?teacher=true`

#### 3. Open Firebase Configuration
- In the Teacher Dashboard, find **"Firebase Configuration"** section
- Click **"Configure Firebase Backend"**

#### 4. Paste Your Config
- Paste the `firebaseConfig` object you copied earlier
- It should look like this (with YOUR values):
  ```json
  {
    "apiKey": "AIzaSyA...",
    "authDomain": "truth-hunters-xyz.firebaseapp.com",
    "projectId": "truth-hunters-xyz",
    "storageBucket": "truth-hunters-xyz.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:abc123"
  }
  ```

#### 5. Set Class Code (Optional)
- Create a unique class code for your period/section:
  - Examples: `PERIOD1-2025`, `MRS-SMITH-6A`, `LINCOLN-MS-FALL`
  - Use only uppercase letters, numbers, and hyphens
  - 3-20 characters
- This separates leaderboards by class period
- Leave blank for school-wide leaderboard

#### 6. Save Configuration
- Click **"Save Configuration"**
- You should see: ✅ "Connected to Firebase"
- Status indicators should turn green

#### 7. Test Connection
- Return to home screen (exit teacher mode)
- Set up a test game as "Test Team"
- Play a few rounds
- Check if score appears in leaderboard
- Verify in Firebase Console → Firestore Database → Data tab
  - You should see a `games` collection with your test game

---

## Security Configuration

### Firestore Security Checklist

- [x] **Production mode enabled** (start in production, not test mode)
- [x] **Security rules deployed** (from `firestore.rules` file)
- [x] **API key restrictions** (optional, see below)
- [x] **Regular security review** (audit Firebase Console monthly)

### Optional: Restrict API Key

For added security, restrict your Firebase API key to your domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your `truth-hunters-*` project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **Browser key** (auto-created by Firebase)
5. Click to edit
6. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add your domain:
     ```
     https://your-school-site.com/*
     https://your-github-username.github.io/Truth-Hunters/*
     ```
7. Click **Save**

**When to do this:**
- If deploying for long-term use
- If concerned about API key abuse
- When ready for production (test first without restrictions)

**When to skip:**
- Testing locally (localhost won't work with restrictions)
- One-time use for a class project
- Still troubleshooting connection issues

---

## Teacher Dashboard

### Accessing the Dashboard

**⚠️ Temporary Access Method (Development Only)**

**Method 1: URL Parameter**
- Add `?teacher=true` to any Truth Hunters URL
- Example: `https://yoursite.com/?teacher=true`
- **Note:** No authentication required (security limitation)

**Method 2: Direct Link**
- Click "Teacher Dashboard" at bottom of home screen

**Production Requirement:** Firebase Authentication must be implemented before unsupervised deployment. See [docs/security/README.md](security/README.md).

### Dashboard Features

#### 1. Leaderboard View
- See all teams across all class periods
- Filter by class code
- Export to CSV for gradebook
- Reset leaderboard (start of new semester)

#### 2. Firebase Configuration
- Test connection status
- Update Firebase config
- Change class code
- Disconnect Firebase (revert to local-only)

#### 3. Claim Moderation (if students submit claims)
- **Pending Claims**: Awaiting teacher review
- **Approve**: Add to game claim pool
- **Reject**: Remove with feedback
- **Edit**: Fix typos or adjust difficulty

#### 4. Class Analytics
- Games played per period
- Average scores and accuracy
- Subject performance breakdown
- Most/least difficult claims

---

## Troubleshooting

### "Failed to connect to Firebase"

**Possible causes:**
1. **Incorrect configuration**
   - Re-copy `firebaseConfig` from Firebase Console
   - Check for typos, missing commas, quotes

2. **Firestore not enabled**
   - Go to Firebase Console → Firestore Database
   - Ensure database is created and active

3. **Security rules not deployed**
   - Go to Firestore → Rules tab
   - Paste rules from `firestore.rules`
   - Click "Publish"

4. **School firewall blocking Firebase**
   - Contact IT to whitelist:
     - `*.firebaseapp.com`
     - `*.firebaseio.com`
     - `*.googleapis.com`

5. **Browser extensions blocking**
   - Try in incognito/private mode
   - Disable ad blockers temporarily

### "Permission denied" errors

**Check:**
- Security rules are deployed (see Part 3)
- Using production mode (not test mode)
- Class code format is valid (A-Z, 0-9, hyphens only)

### Leaderboard not updating

**Try:**
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Check Firebase Console → Firestore → Data
   - Verify `games` collection exists
   - Check if new entries appear
3. Verify connection status in Teacher Dashboard
4. Check browser console for errors (F12 → Console tab)

### "Quota exceeded" error

Firebase free tier limits:
- **Reads**: 50,000/day
- **Writes**: 20,000/day
- **Storage**: 1 GB

**For typical classroom use:**
- 30 students × 5 games/day = ~1,000 writes/day ✅
- Well within free tier

**If exceeded:**
- Upgrade to Firebase Blaze (pay-as-you-go)
- Cost: $0.06 per 100,000 reads (typically <$1/month for schools)

---

## Cost Information

### Firebase Pricing (as of 2025)

**Spark Plan (Free)**:
- 50,000 document reads/day
- 20,000 document writes/day
- 20,000 document deletes/day
- 1 GB storage
- 10 GB bandwidth/month

**Sufficient for:**
- Classes up to ~100 students
- ~500 games/day
- Long-term storage of 10,000+ game records

**Blaze Plan (Pay-as-you-go)**:
- Free tier included (same as Spark)
- After free tier: $0.06 per 100,000 reads
- Realistically: $0-$5/month for typical school
- Requires credit card (billing only if you exceed free tier)

### Typical School Costs

**Small school (1-3 classes, ~60 students)**:
- Free tier sufficient ✅
- Cost: $0/month

**Medium school (10 classes, ~200 students)**:
- May exceed free tier during peak use
- Estimated cost: $2-5/month

**Large school (25+ classes, ~500 students)**:
- Blaze plan recommended
- Estimated cost: $10-15/month

**Cost comparison:**
- Netflix: $15.49/month
- School copy paper: $30/box
- Textbook adoption: $50-100/student

---

## Privacy & FERPA Compliance

### Data Stored in Firebase

Truth Hunters stores:
- ✅ Team names (chosen by students, not real names)
- ✅ Game scores and accuracy
- ✅ Timestamps of games played
- ✅ Achievement badges earned
- ✅ Class codes (teacher-assigned)

Truth Hunters DOES NOT store:
- ❌ Student real names (unless team chooses to use them)
- ❌ Email addresses
- ❌ Student IDs
- ❌ Grades or assessment data
- ❌ Personal identifiable information (PII)

### FERPA Compliance

**Is Truth Hunters FERPA-compliant?**

✅ **Yes**, when used as designed:
- No PII is collected unless students intentionally enter it
- Team names are student-chosen (recommend aliases/nicknames)
- Data is educational records under teacher control
- Firebase is FERPA-compliant as a service provider

**Teacher responsibilities:**
1. **Instruct students** to use team names, not real names
   - Examples: "Team Awesome", "The Detectives", "Class 6A-Team2"
2. **Use class codes** to separate periods
3. **Export and delete data** at end of school year
4. **Review Firebase access logs** periodically

### Recommended Practices

1. **Team naming guidelines**:
   - "Choose a fun team name, not your real names"
   - Review team names before saving scores
   - Use content moderation (built-in)

2. **Data retention**:
   - Export leaderboards at semester end (CSV)
   - Delete old Firebase data annually
   - Firebase Console → Firestore → Select collection → Delete

3. **Parent notifications**:
   - Include in syllabus: "We use educational games with cloud leaderboards"
   - Note: No personal information is required

4. **School approval**:
   - Check with your school's IT/privacy officer
   - Some districts require vendor approval for cloud services
   - Provide them this documentation and Firebase's FERPA compliance docs

---

## Advanced Configuration

### Multiple Classes/Teachers

**Option 1: Shared Firebase, separate class codes**
- All teachers use same Firebase project
- Each period has unique class code (PERIOD1, PERIOD2, etc.)
- Leaderboards separated by code

**Option 2: Separate Firebase projects**
- Each teacher creates own Firebase project
- Complete isolation between classes
- Requires separate setup per teacher

**Recommended:** Option 1 for school-wide deployment

### Exporting Data

**Via Teacher Dashboard:**
1. Go to Teacher Dashboard
2. Click "Export Leaderboard" → CSV
3. Open in Excel/Google Sheets

**Via Firebase Console:**
1. Go to Firestore → Data
2. Select `games` collection
3. Click `... → Export to BigQuery` (advanced)
4. Or use Firestore export tool (command-line)

### Resetting Leaderboard

**For new semester:**
1. Teacher Dashboard → Settings
2. Click "Reset Leaderboard"
3. Confirm (irreversible)

**OR manually:**
1. Firebase Console → Firestore → Data
2. Select `games` collection
3. Click ` ⋮ → Delete collection`
4. Type collection name to confirm

---

## Support

### Getting Help

**Documentation:**
- Firebase official docs: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- Truth Hunters README: [GitHub Repository](https://github.com/LouisRosche/Truth-Hunters)

**Community:**
- Open an issue: [GitHub Issues](https://github.com/LouisRosche/Truth-Hunters/issues)
- Tag with `firebase` or `setup-help`

**Firebase Support:**
- Free tier: Community forums only
- Blaze plan: Email support available
- Enterprise: Dedicated support (schools can request education discount)

---

## Quick Reference Card

**For Teachers:**

```
Firebase Console:  https://console.firebase.google.com
Your Project:      truth-hunters-[school-name]
Your Class Code:   ___________________________
```

**If something breaks:**
1. Check Firebase status: https://status.firebase.google.com
2. Verify security rules are published
3. Test connection in Teacher Dashboard
4. Check browser console (F12) for errors
5. Contact IT if firewall may be blocking

**Emergency fallback:**
- Remove Firebase config in Teacher Dashboard
- Game continues with local-only leaderboards
- No data lost on individual devices

---

**Setup complete!** Your class now has cross-device leaderboards, achievement sharing, and student claim contributions. Students can now compete and collaborate across Chromebooks in your classroom.

Questions? Open an issue on GitHub or contact your school's IT support.
