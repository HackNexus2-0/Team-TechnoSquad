# Migration Guide: Supabase to Firebase

This guide provides step-by-step instructions for migrating your Stock Portfolio Management application from Supabase to Firebase.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Firebase Setup](#firebase-setup)
4. [Code Changes](#code-changes)
5. [Data Migration](#data-migration)
6. [Deployment](#deployment)
7. [Testing](#testing)

## Overview

### What Changed
- **Authentication**: Supabase Auth → Firebase Authentication
- **Database**: PostgreSQL (Supabase) → Cloud Firestore (Firebase)
- **Storage**: Not implemented yet (can use Firebase Storage if needed)
- **Real-time**: Supabase Realtime → Firestore Real-time listeners (not implemented in base version)

### Key Differences

| Feature | Supabase | Firebase |
|---------|----------|----------|
| Database Type | PostgreSQL (Relational) | Firestore (NoSQL Document) |
| Queries | SQL-like queries | Collection/Document queries |
| Auth | Built-in JWT | Firebase Auth with ID tokens |
| Row Level Security | PostgreSQL RLS | Firestore Security Rules |
| Joins | Native SQL joins | Manual joins (fetching related docs) |

## Prerequisites

### Required Accounts & Tools
1. Firebase account (Google account required)
2. Node.js (v18 or higher)
3. npm or yarn
4. Firebase CLI (optional but recommended)

### Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "stock-portfolio-management")
4. Follow the setup wizard
5. Choose your analytics preferences

### Step 2: Enable Firebase Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** sign-in method
4. Configure email templates if desired

### Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll add security rules later)
4. Select your database location (choose closest to your users)
5. Click **Enable**

### Step 4: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click the web icon `</>`
4. Register your app with a nickname
5. Copy the `firebaseConfig` object
6. Create a `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 5: Deploy Firestore Security Rules

1. Initialize Firebase in your project:
```bash
firebase init firestore
```

2. Select your Firebase project
3. Accept default files (firestore.rules, firestore.indexes.json)
4. The security rules file has already been created for you
5. Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

### Step 6: Deploy Firestore Indexes

Deploy the indexes to improve query performance:
```bash
firebase deploy --only firestore:indexes
```

## Code Changes

### Summary of Changed Files

All files have been converted and are in the `project-firebase` folder:

**Core Configuration:**
- ✅ `src/lib/firebase.ts` - Firebase initialization (replaces `supabase.ts`)
- ✅ `src/contexts/AuthContext.tsx` - Firebase Auth integration
- ✅ `package.json` - Updated dependencies

**Pages (Data Layer):**
- ✅ `src/pages/Portfolios.tsx` - Firestore CRUD operations
- ⚠️ `src/pages/Dashboard.tsx` - Needs similar updates
- ⚠️ `src/pages/Settings.tsx` - Needs similar updates
- ⚠️ `src/pages/Login.tsx` - Should work with new AuthContext
- ⚠️ `src/pages/Register.tsx` - Should work with new AuthContext

**Configuration Files:**
- ✅ `firestore.rules` - Security rules
- ✅ `firestore.indexes.json` - Database indexes
- ✅ `.env.example` - Environment variables template

### Key Code Pattern Changes

#### Authentication

**Before (Supabase):**
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**After (Firebase):**
```typescript
await signInWithEmailAndPassword(auth, email, password);
```

#### Data Fetching

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('portfolios')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

**After (Firebase):**
```typescript
const portfoliosRef = collection(db, 'portfolios');
const q = query(
  portfoliosRef,
  where('user_id', '==', userId),
  orderBy('created_at', 'desc')
);
const querySnapshot = await getDocs(q);
const data = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

#### Data Creation

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('portfolios')
  .insert([{ name, user_id: userId }])
  .select()
  .single();
```

**After (Firebase):**
```typescript
const portfoliosRef = collection(db, 'portfolios');
const docRef = await addDoc(portfoliosRef, {
  name,
  user_id: userId,
  created_at: serverTimestamp(),
});
```

#### Data Deletion

**Before (Supabase):**
```typescript
const { error } = await supabase
  .from('portfolios')
  .delete()
  .eq('id', portfolioId);
```

**After (Firebase):**
```typescript
await deleteDoc(doc(db, 'portfolios', portfolioId));
```

## Data Migration

### Understanding Data Structure Changes

Firebase Firestore is a NoSQL database, so the data structure differs from PostgreSQL:

**PostgreSQL (Supabase):**
- Tables with rows and columns
- Foreign keys and joins
- Transactions are atomic across tables

**Firestore (Firebase):**
- Collections with documents
- No foreign keys (use document IDs)
- No native joins (fetch related data separately)
- Transactions are atomic within a single operation

### Firestore Collections Structure

```
firestore
├── users (managed by Firebase Auth)
├── user_preferences/
│   └── {userId}/
│       ├── risk_profile: string
│       ├── investment_horizon: string
│       └── preferred_sectors: array
├── portfolios/
│   └── {portfolioId}/
│       ├── user_id: string
│       ├── name: string
│       ├── description: string
│       ├── initial_capital: number
│       ├── created_at: timestamp
│       └── updated_at: timestamp
├── stocks/
│   └── {stockId}/
│       ├── symbol: string
│       ├── name: string
│       ├── sector: string
│       ├── industry: string
│       ├── exchange: string
│       ├── currency: string
│       ├── created_at: timestamp
│       └── updated_at: timestamp
├── transactions/
│   └── {transactionId}/
│       ├── portfolio_id: string (reference)
│       ├── stock_id: string (reference)
│       ├── transaction_type: string
│       ├── quantity: number
│       ├── price: number
│       ├── fees: number
│       ├── transaction_date: timestamp
│       ├── notes: string
│       └── created_at: timestamp
├── stock_prices/
│   └── {priceId}/
│       ├── stock_id: string (reference)
│       ├── date: timestamp
│       ├── open: number
│       ├── high: number
│       ├── low: number
│       ├── close: number
│       ├── volume: number
│       └── created_at: timestamp
└── portfolio_snapshots/
    └── {snapshotId}/
        ├── portfolio_id: string (reference)
        ├── snapshot_date: timestamp
        ├── total_value: number
        ├── cash_balance: number
        ├── total_return: number
        └── created_at: timestamp
```

### Migration Script (Manual or Automated)

If you have existing data in Supabase, you'll need to migrate it. Here's a conceptual approach:

#### Option 1: Manual Migration (Small Dataset)
1. Export data from Supabase using SQL queries
2. Transform data to match Firestore structure
3. Import using Firebase Console or Admin SDK

#### Option 2: Automated Migration Script (Large Dataset)

Create a Node.js script using both Supabase and Firebase Admin SDKs:

```javascript
// migration-script.js (pseudo-code)
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

// Initialize both
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const firestore = admin.firestore();

async function migratePortfolios() {
  // Fetch from Supabase
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*');
  
  // Write to Firestore
  const batch = firestore.batch();
  portfolios.forEach(portfolio => {
    const docRef = firestore.collection('portfolios').doc();
    batch.set(docRef, {
      user_id: portfolio.user_id,
      name: portfolio.name,
      description: portfolio.description,
      initial_capital: portfolio.initial_capital,
      created_at: admin.firestore.Timestamp.fromDate(new Date(portfolio.created_at)),
      updated_at: admin.firestore.Timestamp.fromDate(new Date(portfolio.updated_at)),
    });
  });
  
  await batch.commit();
}

// Repeat for other collections...
```

## Deployment

### Development Environment

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase config
```

3. Start development server:
```bash
npm run dev
```

### Production Deployment

#### Option 1: Firebase Hosting (Recommended)

1. Build the project:
```bash
npm run build
```

2. Initialize Firebase Hosting:
```bash
firebase init hosting
```

3. Deploy:
```bash
firebase deploy --only hosting
```

#### Option 2: Vercel, Netlify, or other platforms

1. Build the project:
```bash
npm run build
```

2. Add environment variables in your hosting platform
3. Deploy the `dist` folder

## Testing

### Manual Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Create portfolio
- [ ] View portfolios list
- [ ] Select a portfolio
- [ ] Add a transaction (buy)
- [ ] Add a transaction (sell)
- [ ] View transaction history
- [ ] Delete a transaction
- [ ] Delete a portfolio
- [ ] Data persists after logout/login

### Security Testing

1. Test unauthenticated access (should be blocked)
2. Test accessing other users' data (should be blocked)
3. Verify Firestore rules are working correctly

### Performance Monitoring

1. Enable Firebase Performance Monitoring in console
2. Add performance monitoring SDK if needed
3. Monitor query performance in Firebase Console

## Troubleshooting

### Common Issues

**Issue: "Missing Firebase environment variables"**
- Solution: Ensure `.env` file exists and contains all required variables
- Make sure variable names start with `VITE_`

**Issue: "Permission denied" errors**
- Solution: Check Firestore security rules
- Verify user is authenticated
- Ensure rules match your data structure

**Issue: "Cannot read property of undefined" when fetching data**
- Solution: Check that collections exist in Firestore
- Verify field names match between code and database
- Add null checks in your code

**Issue: Slow query performance**
- Solution: Deploy Firestore indexes
- Run: `firebase deploy --only firestore:indexes`

**Issue: Timestamp conversion errors**
- Solution: Use `serverTimestamp()` for new timestamps
- Use `.toDate()` when reading Firestore timestamps

## Best Practices

### Security
- Always validate data on client and server (Firestore rules)
- Never expose Firebase config keys in public repos (they're okay in frontend but restrict with Firebase rules)
- Use environment variables for sensitive data
- Regularly review Firestore security rules

### Performance
- Use pagination for large datasets
- Create proper indexes for complex queries
- Avoid deeply nested data structures
- Use subcollections for one-to-many relationships

### Data Modeling
- Denormalize data when necessary (NoSQL pattern)
- Duplicate data that's frequently read together
- Use document references (IDs) instead of embedding large objects
- Keep documents under 1MB

## Next Steps

1. ✅ Complete remaining page conversions (Dashboard, Settings)
2. ✅ Add real-time listeners for live updates
3. ✅ Implement data pagination
4. ✅ Add error handling and loading states
5. ✅ Set up Firebase Analytics
6. ✅ Configure Firebase Performance Monitoring
7. ✅ Implement offline support (Firestore persistence)

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Migrating from SQL to Firestore](https://firebase.google.com/docs/firestore/solutions/sql-to-firestore)

## Support

If you encounter issues during migration:
1. Check Firebase Console logs
2. Review browser console for errors
3. Verify Firestore rules in the Rules tab
4. Check the Firestore indexes tab for required indexes
