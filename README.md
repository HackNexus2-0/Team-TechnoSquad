# HackNexus 2.0 | Team Project Repository

## Project Information
* **Team Name:** TechnoSquad
* **Project Title:**  Intelligent Stock Portfolio Management System
* **Track/Theme:** FINTECH

## Project Description
Provide a concise overview of the problem you are solving and your proposed solution.

## Technical Stack
**### Frontend
- *React 18** - UI framework
- *TypeScript** - Type safety and better DX
- *Vite** - Fast build tool and dev server
- *Tailwind CSS** - Utility-first CSS framework
- *React Router** - Client-side routing
- *Lucide React** - Beautiful icons
- *Recharts** - Data visualization

*### Backend*
- *Firebase Authentication** - User authentication
- *Cloud Firestore** - NoSQL database
- *Firebase Hosting** - Optional deployment platform****

## Setup and Installation
**## Bug Bounty Round Information**
Follow these steps to get the app running locally: 
### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** (Email/Password)
4. Create a **Firestore Database** (production mode)
5. Get your Firebase config from Project Settings

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Firebase credentials
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore
firebase init firestore

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

## 📚 Detailed Documentation

- *[QUICK_START.md](./QUICK_START.md)** - Step-by-step setup guide
*[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Supabase to Firebase migration details
- *[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture (from original project)

## 🗂️ Project Structure

```
project-firebase/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── Layout.tsx       # Main layout wrapper
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Firebase auth integration
│   ├── lib/                 # Utilities and configurations
│   │   └── firebase.ts      # Firebase initialization
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Dashboard view
│   │   ├── Login.tsx        # Login page
│   │   ├── Register.tsx     # Registration page
│   │   ├── Portfolios.tsx   # Portfolio management
│   │   └── Settings.tsx     # User settings
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Shared types
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore indexes
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Vite configuration
└── tailwind.config.js       # Tailwind CSS config
