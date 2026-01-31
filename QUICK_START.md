# Quick Start Guide - Firebase Version

Get your Stock Portfolio Management app running with Firebase in minutes!

## Prerequisites

- Node.js 18+ installed
- A Google account for Firebase
- Basic knowledge of React and TypeScript

## Step 1: Clone and Install

```bash
# Navigate to the project directory
cd project-firebase

# Install dependencies
npm install
```

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "my-portfolio-app")
4. Disable Google Analytics (optional for now)
5. Click **"Create project"**

## Step 3: Enable Authentication

1. In the Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Select **"Email/Password"** from the sign-in providers
4. Toggle **"Email/Password"** to enabled
5. Click **"Save"**

## Step 4: Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose a location close to your users
5. Click **"Enable"**

## Step 5: Get Your Firebase Config

1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **web icon** `</>`
5. Register your app (give it a nickname)
6. Copy the `firebaseConfig` object

## Step 6: Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

2. Open `.env` and paste your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app-12345
VITE_FIREBASE_STORAGE_BUCKET=your-app-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijk
```

## Step 7: Deploy Security Rules

### Option A: Using Firebase CLI (Recommended)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Select your project
# Accept default files (firestore.rules, firestore.indexes.json)

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### Option B: Manual Setup (Console)

1. In Firebase Console, go to **Firestore Database**
2. Click the **"Rules"** tab
3. Copy the contents from `firestore.rules` file
4. Paste into the rules editor
5. Click **"Publish"**

For indexes:
1. Click the **"Indexes"** tab
2. Copy each index from `firestore.indexes.json`
3. Create them manually or wait for Firebase to suggest them

## Step 8: Run the App

```bash
# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Step 9: Test the App

1. **Register a new account:**
   - Click "Register" or "Sign Up"
   - Enter email and password
   - Submit the form

2. **Create a portfolio:**
   - Click "Create Portfolio"
   - Enter name and initial capital
   - Click "Create"

3. **Add a transaction:**
   - Select your portfolio
   - Click "Add Transaction"
   - Enter stock details (e.g., AAPL, Apple Inc.)
   - Click "Add Transaction"

## Troubleshooting

### "Missing Firebase environment variables"
- Make sure `.env` file exists in the root directory
- Check that all variables start with `VITE_`
- Restart the dev server after creating `.env`

### "Permission denied" when creating portfolio
- Make sure you deployed the Firestore security rules
- Check that you're logged in
- Verify rules in Firebase Console

### "Failed to create portfolio"
- Open browser console (F12) to see detailed error
- Check that Firestore is enabled in Firebase Console
- Verify your Firebase project is correctly configured

### Authentication not working
- Ensure Email/Password authentication is enabled
- Check that Firebase config is correct in `.env`
- Clear browser cache and cookies

## Next Steps

Now that your app is running:

1. **Customize the UI**: Edit components in `src/components/` and `src/pages/`
2. **Add Features**: Implement Dashboard and Settings pages
3. **Deploy**: Use Firebase Hosting, Vercel, or Netlify
4. **Learn More**: Check out the full [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

## Production Deployment

### Using Firebase Hosting

```bash
# Build the app
npm run build

# Initialize hosting (if not done already)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

Your app will be live at: `https://your-app-12345.web.app`

### Using Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Using Netlify

```bash
# Build the app
npm run build

# Drag and drop the 'dist' folder to Netlify
# Or use Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Common Firebase Console Locations

- **Authentication**: [console.firebase.google.com/project/YOUR-PROJECT/authentication](https://console.firebase.google.com)
- **Firestore**: [console.firebase.google.com/project/YOUR-PROJECT/firestore](https://console.firebase.google.com)
- **Rules**: [console.firebase.google.com/project/YOUR-PROJECT/firestore/rules](https://console.firebase.google.com)
- **Indexes**: [console.firebase.google.com/project/YOUR-PROJECT/firestore/indexes](https://console.firebase.google.com)
- **Usage**: [console.firebase.google.com/project/YOUR-PROJECT/usage](https://console.firebase.google.com)

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [React + Firebase Tutorial](https://firebase.google.com/docs/web/setup)

## Need Help?

- Check the [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed information
- Review Firebase Console logs
- Check browser console (F12) for errors
- Verify Firestore rules and indexes are deployed
