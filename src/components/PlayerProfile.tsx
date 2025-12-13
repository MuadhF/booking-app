import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Clock, MapPin, CreditCard as Edit2, Save, X, History, PhoneIncoming as Upcoming, Lock, Eye, EyeOff } from 'lucide-react';
import { playerAuthApi, bookingsApi, type PlayerProfile, type Booking } from '../lib/supabase';

interface PlayerProfileProps {
  user: any;
}

export default function PlayerProfile({ user }: PlayerProfileProps) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [editData, setEditData] = useState({
    full_name: '',
    phone: ''
  });

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load profile
      const profileData = await playerAuthApi.getProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setEditData({
          full_name: profileData.full_name,
          phone: profileData.phone || ''
        });
      }

      // Load bookings
      let userBookings: Booking[] = [];
      try {
        userBookings = await bookingsApi.getByPlayerId(user.id);
      } catch (err) {
        // Fallback to email-based lookup for bookings made before account creation
        userBookings = await bookingsApi.getByPlayerEmail(user.email);
      }
      
      setBookings(userBookings);
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedProfile = await playerAuthApi.updateProfile(user.id, {
        full_name: editData.full_name,
        phone: editData.phone
      });

      setProfile(updatedProfile);
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setError(null);
      setSuccess(null);

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      await playerAuthApi.updatePassword(passwordData.newPassword);

      setSuccess('Password changed successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const cancelEdit = () => {
    if (profile) {
      setEditData({
        full_name: profile.full_name,
        phone: profile.phone || ''
      });
    }
    setEditMode(false);
    setError(null);
    setSuccess(null);
  };

  const cancelPasswordChange = () => {
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordSection(false);
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (booking: Booking) => {
    const bookingDate = new Date(booking.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter(booking => !isUpcoming(booking));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {profile?.full_name || 'Player Profile'}
                    </h1>
                    <p className="text-green-100">{user.email}</p>
                  </div>
                </div>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
                  <div className="w-5 h-5 text-red-600">⚠️</div>
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
                  <div className="w-5 h-5 text-green-600">✅</div>
                  <p className="text-green-800">{success}</p>
                </div>
              )}

              {editMode ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={editData.full_name}
                        onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{profile?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Password</p>
                          <p className="text-xs text-gray-500">Change your account password</p>
                        </div>
                      </div>
                      {!showPasswordSection && (
                        <button
                          onClick={() => setShowPasswordSection(true)}
                          className="text-green-600 hover:text-green-700 font-medium text-sm"
                        >
                          Change Password
                        </button>
                      )}
                    </div>

                    {showPasswordSection && (
                      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Enter new password"
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Confirm new password"
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex space-x-4 pt-2">
                          <button
                            onClick={handleChangePassword}
                            disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                          >
                            {changingPassword ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Changing...
                              </>
                            ) : (
                              <>
                                <Lock className="w-5 h-5 mr-2" />
                                Change Password
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelPasswordChange}
                            className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
                          >
                            <X className="w-5 h-5 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bookings Section */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">My Bookings</h2>
              <p className="text-blue-100">Manage your football pitch reservations</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 p-6 pb-0">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-100 text-blue-700 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Upcoming className="w-4 h-4" />
                <span>Upcoming ({upcomingBookings.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'past'
                    ? 'bg-blue-100 text-blue-700 shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Past ({pastBookings.length})</span>
              </button>
            </div>

            <div className="p-6">
              {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No {activeTab} bookings
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {activeTab === 'upcoming' 
                      ? "You don't have any upcoming bookings. Book a pitch to get started!"
                      : "You haven't made any bookings yet."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).map((booking) => (
                    <div key={booking.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${
                            activeTab === 'upcoming' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Calendar className={`w-6 h-6 ${
                              activeTab === 'upcoming' ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {(booking as any).pitches?.name || 'Football Pitch'} 
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(booking.booking_date)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{booking.start_time} ({booking.duration_hours}h)</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{(booking as any).pitches?.location || 'Location'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 text-lg">
                            Rs. {booking.total_price.toLocaleString()}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            activeTab === 'upcoming' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {booking.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}