import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { User, Shield, Bell, Palette } from 'lucide-react';

interface UserPreferences {
  id?: string;
  user_id: string;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  investment_horizon: 'short' | 'medium' | 'long';
  preferred_sectors: string[];
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    user_id: user?.uid || '',
    risk_profile: 'moderate',
    investment_horizon: 'medium',
    preferred_sectors: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const prefsRef = collection(db, 'user_preferences');
      const q = query(prefsRef, where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setPreferences({
          id: doc.id,
          ...doc.data() as UserPreferences,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('');

    try {
      if (preferences.id) {
        // Update existing preferences
        const prefDoc = doc(db, 'user_preferences', preferences.id);
        await updateDoc(prefDoc, {
          risk_profile: preferences.risk_profile,
          investment_horizon: preferences.investment_horizon,
          preferred_sectors: preferences.preferred_sectors,
          updated_at: serverTimestamp(),
        });
      } else {
        // Create new preferences
        const prefsRef = collection(db, 'user_preferences');
        const docRef = await addDoc(prefsRef, {
          user_id: user.uid,
          risk_profile: preferences.risk_profile,
          investment_horizon: preferences.investment_horizon,
          preferred_sectors: preferences.preferred_sectors,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        setPreferences({ ...preferences, id: docRef.id });
      }

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSectorToggle = (sector: string) => {
    const sectors = preferences.preferred_sectors || [];
    if (sectors.includes(sector)) {
      setPreferences({
        ...preferences,
        preferred_sectors: sectors.filter((s) => s !== sector),
      });
    } else {
      setPreferences({
        ...preferences,
        preferred_sectors: [...sectors, sector],
      });
    }
  };

  const sectors = [
    'Technology',
    'Healthcare',
    'Finance',
    'Energy',
    'Consumer Goods',
    'Real Estate',
    'Utilities',
    'Industrials',
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and preferences</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes('success')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={user?.uid || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Investment Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Investment Preferences</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Profile</label>
                <select
                  value={preferences.risk_profile}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      risk_profile: e.target.value as 'conservative' | 'moderate' | 'aggressive',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="conservative">Conservative - Low risk, stable returns</option>
                  <option value="moderate">Moderate - Balanced risk and return</option>
                  <option value="aggressive">Aggressive - High risk, high potential return</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Horizon
                </label>
                <select
                  value={preferences.investment_horizon}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      investment_horizon: e.target.value as 'short' | 'medium' | 'long',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="short">Short-term - Less than 2 years</option>
                  <option value="medium">Medium-term - 2-5 years</option>
                  <option value="long">Long-term - More than 5 years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Sectors
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sectors.map((sector) => (
                    <label
                      key={sector}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={preferences.preferred_sectors?.includes(sector)}
                        onChange={() => handleSectorToggle(sector)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{sector}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={savePreferences}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={() => signOut()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
