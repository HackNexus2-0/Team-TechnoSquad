# Stock Portfolio Management System - Firebase Version

A modern, full-stack web application for managing stock portfolios, built with React, TypeScript, and Firebase.



## 🚀 Features

- **User Authentication**: Secure email/password authentication with Firebase Auth
- **Portfolio Management**: Create and manage multiple investment portfolios
- **Transaction Tracking**: Record buy/sell transactions with detailed information
- **Real-time Data**: Cloud Firestore for fast, scalable data storage
- **Stock Information**: Track stocks with symbols, names, sectors, and more
- **Transaction History**: Complete audit trail of all portfolio activities
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Type Safety**: Built with TypeScript for reliability and better developer experience

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization

### Backend
- **Firebase Authentication** - User authentication
- **Cloud Firestore** - NoSQL database
- **Firebase Hosting** - Optional deployment platform

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- A **Google account** for Firebase
- Basic knowledge of React and TypeScript

## 🎯 Quick Start

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

- **[QUICK_START.md](./QUICK_START.md)** - Step-by-step setup guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Supabase to Firebase migration details
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture (from original project)

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
```

## 🔒 Security

### Firestore Security Rules

The app uses Firestore security rules to ensure data privacy:

- Users can only read/write their own portfolios
- Transactions are accessible only to portfolio owners
- Stock data is publicly readable but write-protected
- All operations require authentication

See [firestore.rules](./firestore.rules) for the complete ruleset.

### Environment Variables

**Important**: Never commit your `.env` file to version control. The Firebase config values are safe to expose in frontend code, but security is enforced through Firestore rules.

## 📊 Database Structure

### Collections

**portfolios**
```typescript
{
  id: string
  user_id: string        // Firebase Auth UID
  name: string
  description: string
  initial_capital: number
  created_at: Timestamp
  updated_at: Timestamp
}
```

**transactions**
```typescript
{
  id: string
  portfolio_id: string   // Reference to portfolio
  stock_id: string       // Reference to stock
  transaction_type: 'buy' | 'sell'
  quantity: number
  price: number
  fees: number
  transaction_date: Timestamp
  notes: string
  created_at: Timestamp
}
```

**stocks**
```typescript
{
  id: string
  symbol: string         // e.g., "AAPL"
  name: string           // e.g., "Apple Inc."
  sector: string
  industry: string
  exchange: string
  currency: string
  created_at: Timestamp
  updated_at: Timestamp
}
```

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
# Build the app
npm run build

# Initialize Firebase Hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build the app
npm run build

# Deploy the dist folder to Netlify
# Or use Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🧪 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🔄 Migrating from Supabase

If you're migrating from the Supabase version:

1. Read the [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. Set up Firebase project and services
3. Update environment variables
4. Deploy Firestore rules and indexes
5. Optionally migrate existing data

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Missing Firebase environment variables"
- **Solution**: Ensure `.env` file exists with all required variables starting with `VITE_`

**Issue**: "Permission denied" errors in Firestore
- **Solution**: Deploy security rules: `firebase deploy --only firestore:rules`

**Issue**: Slow query performance
- **Solution**: Deploy indexes: `firebase deploy --only firestore:indexes`

**Issue**: Authentication errors
- **Solution**: Verify Email/Password auth is enabled in Firebase Console

For more troubleshooting tips, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md#troubleshooting).

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Original Supabase version design and architecture
- Firebase team for excellent documentation
- React and Vite communities
- Tailwind CSS for the amazing styling framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [QUICK_START.md](./QUICK_START.md) guide
2. Read the [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
3. Review [Firebase Documentation](https://firebase.google.com/docs)
4. Open an issue on GitHub

## 🔮 Future Enhancements

- [ ] Real-time portfolio updates using Firestore listeners
- [ ] Advanced analytics and performance charts
- [ ] Stock price integration with external APIs
- [ ] Portfolio sharing and collaboration features
- [ ] Mobile app (React Native or Flutter)
- [ ] Automated portfolio rebalancing suggestions
- [ ] Email notifications for significant events
- [ ] Export to CSV/PDF functionality
- [ ] Dark mode support
- [ ] Multi-currency support

---

**Built with ❤️ using React, TypeScript, and Firebase**
