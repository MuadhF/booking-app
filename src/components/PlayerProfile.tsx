import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Clock, MapPin, CreditCard as Edit2, Save, X, History, PhoneIncoming as Upcoming, Lock, Eye, EyeOff, XCircle, RefreshCw } from 'lucide-react';
import { playerAuthApi, bookingsApi, type PlayerProfile, type Booking } from '../lib/supabase';
import RescheduleModal from './RescheduleModal';

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

  const [rescheduleBooking, setRescheduleBooking] = useState<(Booking & { pitches?: { name: string; location: string } }) | null>(null);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

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

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingBooking(true);
      setError(null);
      setSuccess(null);

      await bookingsApi.cancelBooking(bookingId);

      setSuccess('Booking cancelled successfully!');
      setCancelBookingId(null);
      setTimeout(() => setSuccess(null), 3000);

      await loadProfileData();
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingBooking(false);
    }
  };

  const handleRescheduleSuccess = async () => {
    setRescheduleBooking(null);
    setSuccess('Booking rescheduled successfully!');
    setTimeout(() => setSuccess(null), 3000);
    await loadProfileData();
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
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    return bookingDateTime >= now && booking.status === 'confirmed';
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter(booking => !isUpcoming(booking));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {profile?.full_name || 'Player Profile'}
                    </h1>
                    <p className="text-primary-100">{user.email}</p>
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

            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center space-x-2">
                  <div className="w-4 h-4 text-red-600">⚠️</div>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4 flex items-center space-x-2">
                  <div className="w-4 h-4 text-primary-600">✅</div>
                  <p className="text-primary-800 text-sm">{success}</p>
                </div>
              )}

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={editData.full_name}
                        onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1.5" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Email</p>
                        <p className="font-medium text-gray-900 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900 text-sm">{profile?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Password</p>
                          <p className="text-xs text-gray-500">Change your account password</p>
                        </div>
                      </div>
                      {!showPasswordSection && (
                        <button
                          onClick={() => setShowPasswordSection(true)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-xs"
                        >
                          Change Password
                        </button>
                      )}
                    </div>

                    {showPasswordSection && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Enter new password"
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Confirm new password"
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex space-x-3 pt-1">
                          <button
                            onClick={handleChangePassword}
                            disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                          >
                            {changingPassword ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1.5"></div>
                                Changing...
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-1.5" />
                                Change Password
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelPasswordChange}
                            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
                          >
                            <X className="w-4 h-4 mr-1.5" />
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
            <div className="bg-gradient-to-r from-secondary-600 to-purple-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">My Bookings</h2>
              <p className="text-secondary-100">Manage your football pitch reservations</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 p-6 pb-0">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'upcoming'
                    ? 'bg-secondary-100 text-secondary-700 shadow-md'
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
                    ? 'bg-secondary-100 text-secondary-700 shadow-md'
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
                  {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).map((booking) => {
                    const isCancelled = booking.status === 'cancelled';
                    return (
                      <div key={booking.id} className={`rounded-xl p-6 hover:shadow-md transition-shadow ${
                        isCancelled ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className={`p-3 rounded-lg ${
                              isCancelled ? 'bg-red-100' :
                              activeTab === 'upcoming' ? 'bg-primary-100' : 'bg-gray-100'
                            }`}>
                              <Calendar className={`w-6 h-6 ${
                                isCancelled ? 'text-red-600' :
                                activeTab === 'upcoming' ? 'text-primary-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {(booking as any).pitches?.name || 'Football Pitch'}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
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
                          <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`font-semibold text-lg ${
                              isCancelled
                                ? 'text-gray-500 line-through'
                                : 'text-primary-600'
                            }`}>
                              Rs. {booking.total_price.toLocaleString()}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                              booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 font-semibold'
                                : activeTab === 'upcoming'
                                ? 'bg-primary-100 text-primary-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {booking.status}
                            </div>
                          </div>
                          {activeTab === 'upcoming' && booking.status === 'confirmed' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setRescheduleBooking(booking as any)}
                                className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors flex items-center space-x-1 text-sm font-medium"
                              >
                                <RefreshCw className="w-4 h-4" />
                                <span>Reschedule</span>
                              </button>
                              <button
                                onClick={() => setCancelBookingId(booking.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1 text-sm font-medium"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {cancelBookingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Cancel Booking</h3>
                <p className="text-sm text-gray-600">Are you sure you want to cancel?</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              This action cannot be undone. Your booking will be cancelled and marked as cancelled in your booking history.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => handleCancelBooking(cancelBookingId)}
                disabled={cancellingBooking}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {cancellingBooking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    Yes, Cancel Booking
                  </>
                )}
              </button>
              <button
                onClick={() => setCancelBookingId(null)}
                disabled={cancellingBooking}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}