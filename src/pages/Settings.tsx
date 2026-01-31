import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { UserPreferences } from '../types';
import { Shield, Target, Clock, Check } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    risk_profile: 'moderate' as 'conservative' | 'moderate' | 'aggressive',
    investment_horizon: 'medium' as 'short' | 'medium' | 'long',
    preferred_sectors: [] as string[],
  });

  const sectors = [
    'Technology',
    'Healthcare',
    'Finance',
    'Consumer',
    'Energy',
    'Industrial',
    'Real Estate',
    'Utilities',
    'Materials',
    'Telecommunications',
  ];

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data);
        setForm({
          risk_profile: data.risk_profile,
          investment_horizon: data.investment_horizon,
          preferred_sectors: data.preferred_sectors,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('');

    try {
      if (preferences) {
        const { error } = await supabase
          .from('user_preferences')
          .update({
            risk_profile: form.risk_profile,
            investment_horizon: form.investment_horizon,
            preferred_sectors: form.preferred_sectors,
            updated_at: new Date().toISOString(),
          })
          .eq('id', preferences.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_preferences').insert([
          {
            user_id: user.id,
            risk_profile: form.risk_profile,
            investment_horizon: form.investment_horizon,
            preferred_sectors: form.preferred_sectors,
          },
        ]);

        if (error) throw error;
      }

      setMessage('Preferences saved successfully!');
      loadPreferences();
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleSector = (sector: string) => {
    if (form.preferred_sectors.includes(sector)) {
      setForm({ ...form, preferred_sectors: form.preferred_sectors.filter((s) => s !== sector) });
    } else {
      setForm({ ...form, preferred_sectors: [...form.preferred_sectors, sector] });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Preferences</h1>
          <p className="text-gray-600 mt-2">
            Set your investment preferences to receive personalized recommendations
          </p>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 flex items-center">
              <Check className="w-5 h-5 mr-2" />
              {message}
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-8">
            <div>
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Risk Profile</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setForm({ ...form, risk_profile: 'conservative' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    form.risk_profile === 'conservative'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Conservative</h3>
                  <p className="text-sm text-gray-600">
                    Prioritize capital preservation with low-risk investments. Suitable for risk-averse investors.
                  </p>
                </div>
                <div
                  onClick={() => setForm({ ...form, risk_profile: 'moderate' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    form.risk_profile === 'moderate'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Moderate</h3>
                  <p className="text-sm text-gray-600">
                    Balance between growth and stability. Suitable for most investors seeking steady returns.
                  </p>
                </div>
                <div
                  onClick={() => setForm({ ...form, risk_profile: 'aggressive' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    form.risk_profile === 'aggressive'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Aggressive</h3>
                  <p className="text-sm text-gray-600">
                    Maximize growth potential with higher risk tolerance. Suitable for experienced investors.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Investment Horizon</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setForm({ ...form, investment_horizon: 'short' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    form.investment_horizon === 'short'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Short-Term</h3>
                  <p className="text-sm text-gray-600">Less than 3 years. Focus on liquidity and quick returns.</p>
                </div>
                <div
                  onClick={() => setForm({ ...form, investment_horizon: 'medium' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    form.investment_horizon === 'medium'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Medium-Term</h3>
                  <p className="text-sm text-gray-600">3-10 years. Balance between growth and stability.</p>
                </div>
                <div
                  onClick={() => setForm({ ...form, investment_horizon: 'long' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    form.investment_horizon === 'long'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Long-Term</h3>
                  <p className="text-sm text-gray-600">10+ years. Focus on long-term wealth building.</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Preferred Sectors</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select the sectors you're interested in for investment recommendations
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {sectors.map((sector) => (
                  <div
                    key={sector}
                    onClick={() => toggleSector(sector)}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition text-center ${
                      form.preferred_sectors.includes(sector)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{sector}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
