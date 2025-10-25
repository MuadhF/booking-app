import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Users, Phone, Mail, LogOut, Eye, CheckCircle } from 'lucide-react';
import { bookingsApi, pitchesApi, type Booking, type Pitch } from '../lib/supabase';

interface VenueDashboardProps {
  venueId: string;
  venueName: string;
  onLogout: () => void;
}

interface NewBooking {
  date: string;
  time: string;
  duration: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export default function VenueDashboard({ venueId, venueName, onLogout }: VenueDashboardProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'new-booking'>('schedule');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venue, setVenue] = useState<Pitch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBooking, setNewBooking] = useState<NewBooking>({
    date: '',
    time: '',
    duration: 1,
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  useEffect(() => {
    loadVenueData();
    loadBookings();
  }, [venueId]);

  const loadVenueData = async () => {
    try {
      const venueData = await pitchesApi.getById(venueId);
      setVenue(venueData);
    } catch (err) {
      console.error('Error loading venue data:', err);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const allBookings = await bookingsApi.getAll();
      const venueBookings = allBookings.filter(booking => booking.pitch_id === venueId);
      setBookings(venueBookings);
    } catch (err) {
      setError('Failed to load bookings');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue) return;

    try {
      setLoading(true);
      setError(null);

      const bookingData = {
        pitch_id: venueId,
        booking_date: newBooking.date,
        start_time: newBooking.time,
        duration_hours: newBooking.duration,
        customer_name: newBooking.customerName,
        customer_email: newBooking.customerEmail,
        customer_phone: newBooking.customerPhone,
        total_price: venue.price_per_hour * newBooking.duration
      };

      await bookingsApi.create(bookingData);
      
      // Reset form
      setNewBooking({
        date: '',
        time: '',
        duration: 1,
        customerName: '',
        customerEmail: '',
        customerPhone: ''
      });

      // Reload bookings
      await loadBookings();
      
      // Switch to schedule tab
      setActiveTab('schedule');
      
    } catch (err) {
      setError('Failed to create booking');
      console.error('Error creating booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const groupBookingsByDate = (bookings: Booking[]) => {
    const grouped: { [date: string]: Booking[] } = {};
    bookings.forEach(booking => {
      if (!grouped[booking.booking_date]) {
        grouped[booking.booking_date] = [];
      }
      grouped[booking.booking_date].push(booking);
    });
    
    // Sort dates
    const sortedDates = Object.keys(grouped).sort();
    const result: { [date: string]: Booking[] } = {};
    sortedDates.forEach(date => {
      result[date] = grouped[date].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    
    return result;
  };

  const groupedBookings = groupBookingsByDate(bookings);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{venueName}</h1>
              <p className="text-sm text-gray-600">Venue Management Dashboard</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white rounded-xl p-1 shadow-lg max-w-md">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'schedule'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('new-booking')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'new-booking'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
            <div className="w-5 h-5 text-red-600">⚠️</div>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Booking Schedule</h2>
              <div className="text-sm text-gray-600">
                Total bookings: {bookings.length}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading schedule...</p>
              </div>
            ) : Object.keys(groupedBookings).length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">Create your first booking to get started</p>
                <button
                  onClick={() => setActiveTab('new-booking')}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Create Booking
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedBookings).map(([date, dateBookings]) => (
                  <div key={date} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
                      <h3 className="text-xl font-bold text-white">{formatDate(date)}</h3>
                      <p className="text-green-100">{dateBookings.length} booking{dateBookings.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {dateBookings.map((booking) => (
                          <div key={booking.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Clock className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {booking.start_time} ({booking.duration_hours}h)
                                </div>
                                <div className="text-sm text-gray-600">{booking.customer_name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">
                                Rs. {booking.total_price.toLocaleString()}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{booking.customer_phone}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{booking.customer_email}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Booking Tab */}
        {activeTab === 'new-booking' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Create New Booking</h2>
                <p className="text-green-100 mt-1">Add a booking for {venueName}</p>
              </div>

              <form onSubmit={handleCreateBooking} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={newBooking.date}
                        onChange={(e) => setNewBooking({...newBooking, date: e.target.value})}
                        min={getTomorrowDate()}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={newBooking.time}
                        onChange={(e) => setNewBooking({...newBooking, time: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration (hours)
                    </label>
                    <select
                      value={newBooking.duration}
                      onChange={(e) => setNewBooking({...newBooking, duration: Number(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value={1}>1 hour</option>
                      <option value={2}>2 hours</option>
                      <option value={3}>3 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={newBooking.customerName}
                        onChange={(e) => setNewBooking({...newBooking, customerName: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={newBooking.customerEmail}
                        onChange={(e) => setNewBooking({...newBooking, customerEmail: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="customer@example.com"
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
                        value={newBooking.customerPhone}
                        onChange={(e) => setNewBooking({...newBooking, customerPhone: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="+94 77 123 4567"
                        required
                      />
                    </div>
                  </div>
                </div>

                {venue && (
                  <div className="mt-6 bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Booking Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Venue:</span>
                        <span className="font-medium">{venue.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rate per hour:</span>
                        <span className="font-medium">Rs. {venue.price_per_hour.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{newBooking.duration} hour{newBooking.duration > 1 ? 's' : ''}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 mt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Total:</span>
                          <span className="font-bold text-green-600 text-lg">
                            Rs. {(venue.price_per_hour * newBooking.duration).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Create Booking
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}