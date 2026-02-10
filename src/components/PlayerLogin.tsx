import React, { useState } from 'react';
import { User, Lock, Mail, Phone, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { playerAuthApi } from '../lib/supabase';

interface PlayerLoginProps {
  onLogin: (authData: any) => void;
}

export default function PlayerLogin({ onLogin }: PlayerLoginProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const [resetEmail, setResetEmail] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await playerAuthApi.resetPassword(resetEmail);
      setSuccess('Password reset email sent! Please check your inbox and follow the instructions.');
      setResetEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signup') {
        const authData = await playerAuthApi.signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.phone
        );
        
        if (authData.user && !authData.user.email_confirmed_at) {
          setSuccess('Account created! Please check your email to verify your account before signing in.');
          setMode('signin');
          setFormData({ email: formData.email, password: '', fullName: '', phone: '' });
        } else if (authData.user) {
          onLogin(authData);
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        const authData = await playerAuthApi.signIn(formData.email, formData.password);
        if (authData.user) {
          onLogin(authData);
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Please check your email and click the verification link before signing in.');
      } else if (err.message.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', fullName: '', phone: '' });
    setError(null);
    setSuccess(null);
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    resetForm();
    setResetEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-white" />
              <h1 className="text-2xl font-bold text-white">
                {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
              </h1>
            </div>
            <p className="text-primary-100 mt-1">
              {mode === 'signin'
                ? 'Sign in to manage your bookings'
                : mode === 'signup'
                ? 'Join us to book and track your games'
                : 'Enter your email to receive a password reset link'
              }
            </p>
          </div>

          <div className="p-8">
            {/* Mode Toggle */}
            {mode !== 'reset' && (
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => switchMode('signin')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  mode === 'signin'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  mode === 'signup'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
                <div className="w-5 h-5 text-red-600">⚠️</div>
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
                <div className="w-5 h-5 text-primary-600">✅</div>
                <p className="text-primary-800">{success}</p>
              </div>
            )}

            {mode === 'reset' ? (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>
            </form>
            )}

            {mode === 'signin' && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => switchMode('reset')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {mode !== 'reset' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  {mode === 'signin' ? 'Sign up here' : 'Sign in here'}
                </button>
              </p>
            </div>
            )}

            {mode === 'signup' && (
            <div className="mt-6 p-4 bg-secondary-50 rounded-xl">
              <p className="text-sm text-secondary-800">
                <strong>Benefits of creating an account:</strong>
              </p>
              <ul className="text-xs text-secondary-700 mt-2 space-y-1">
                <li>• View all your past and upcoming bookings</li>
                <li>• Faster checkout with saved details</li>
                <li>• Manage and modify your reservations</li>
                <li>• Get booking confirmations and reminders</li>
              </ul>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}