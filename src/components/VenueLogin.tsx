import React, { useState } from 'react';
import { Lock, User, Building2 } from 'lucide-react';
import { venueCredentialsApi } from '../lib/supabase';

interface VenueLoginProps {
  onLogin: (venueId: string, venueName: string) => void;
}

export default function VenueLogin({ onLogin }: VenueLoginProps) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Try to authenticate with Supabase
      const authResult = await venueCredentialsApi.authenticate(credentials.username, credentials.password);
      
      if (authResult) {
        onLogin(authResult.venue.id, authResult.venue.name);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      // Fallback to mock credentials if Supabase is not configured
      const venueCredentials = {
        'premier_arena': {
          password: 'arena123',
          venueId: '1',
          venueName: 'Premier Football Arena'
        },
        'elite_complex': {
          password: 'elite123',
          venueId: '2',
          venueName: 'Elite Sports Complex'
        },
        'championship_ground': {
          password: 'champ123',
          venueId: '3',
          venueName: 'Championship Futsal Ground'
        }
      };

      const venue = venueCredentials[credentials.username as keyof typeof venueCredentials];
      
      if (venue && venue.password === credentials.password) {
        onLogin(venue.venueId, venue.venueName);
      } else {
        setError('Invalid username or password');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Venue Portal</h1>
            </div>
            <p className="text-green-100 mt-1">Access your venue management dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
                <Lock className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">Demo Credentials:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>premier_arena</strong> / arena123</p>
                <p><strong>elite_complex</strong> / elite123</p>
                <p><strong>championship_ground</strong> / champ123</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}