import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Users, Phone, Mail, LogOut, Eye, CheckCircle, History } from 'lucide-react';
import { bookingsApi, pitchesApi, type Booking, type Pitch } from '../lib/supabase';
import Footer from './Footer';

interface VenueDashboardProps {
  venueId: string;
  venueName: string;
  onLogout: () => void;
  onPageChange: (page: string) => void;
}

interface NewBooking {
  date: string;
  time: string;
  duration: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export default function VenueDashboard({ venueId, venueName, onLogout, onPageChange }: VenueDashboardProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'past-bookings' | 'new-booking'>('schedule');
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
  const [dateError, setDateError] = useState<string | null>(null);

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
      console.log('Loading bookings for venue:', venueId);
      const allBookings = await bookingsApi.getAll();
      console.log('All bookings loaded:', allBookings);
      
      // Log the first booking's full structure
      if (allBookings.length > 0) {
        console.log('First booking full structure:', JSON.stringify(allBookings[0], null, 2));
      }
      
      const venueBookings = allBookings.filter(booking => booking.pitch_id === venueId);
      console.log('Venue bookings filtered:', venueBookings);
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

      // Debug: Log the venue booking form state
      console.log('=== VENUE BOOKING FORM DEBUG ===');
      console.log('New Booking State:', newBooking);
      console.log('Venue:', venue);

      const bookingData = {
        pitch_id: venueId,
        booking_date: newBooking.date,
        start_time: newBooking.time,
        duration_hours: newBooking.duration,
        total_price: venue.price_per_hour * newBooking.duration,
        guest_name: newBooking.customerName,
        guest_email: newBooking.customerEmail,
        guest_phone: newBooking.customerPhone
      };

      console.log('=== VENUE BOOKING DATA TO SEND ===');
      console.log('Full booking data:', JSON.stringify(bookingData, null, 2));
      console.log('Guest name:', bookingData.guest_name);
      console.log('Guest email:', bookingData.guest_email);
      console.log('Guest phone:', bookingData.guest_phone);
      
      const createdBooking = await bookingsApi.create(bookingData);
      
      console.log('=== VENUE BOOKING CREATION RESPONSE ===');
      console.log('Response data:', JSON.stringify(createdBooking, null, 2));
      
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

  const getMaxBookingDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setNewBooking({...newBooking, date: selectedDate});

    if (selectedDate) {
      const selected = new Date(selectedDate);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);

      if (selected > maxDate) {
        setDateError('Bookings can only be made up to 30 days in advance');
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
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

  const isBookingPast = (booking: Booking) => {
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    return bookingDateTime < new Date();
  };

  const upcomingBookings = bookings.filter(b => !isBookingPast(b));
  const pastBookings = bookings.filter(b => isBookingPast(b));

  const groupedUpcomingBookings = groupBookingsByDate(upcomingBookings);
  const groupedPastBookings = groupBookingsByDate(pastBookings);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="RivoBook" className="h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{venueName}</h1>
                <p className="text-sm text-gray-600">Venue Management Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => {
                onLogout();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
        <div className="flex space-x-1 mb-8 bg-white rounded-xl p-1 shadow-lg max-w-2xl">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'schedule'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Upcoming</span>
          </button>
          <button
            onClick={() => setActiveTab('past-bookings')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'past-bookings'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Past</span>
          </button>
          <button
            onClick={() => setActiveTab('new-booking')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'new-booking'
                ? 'bg-primary-600 text-white shadow-md'
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

        {/* Upcoming Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Bookings</h2>
              <div className="text-sm text-gray-600">
                {upcomingBookings.length} booking{upcomingBookings.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading schedule...</p>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming bookings</h3>
                <p className="text-gray-600 mb-6">Create your first booking to get started</p>
                <button
                  onClick={() => setActiveTab('new-booking')}
                  className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  Create Booking
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedUpcomingBookings).map(([date, dateBookings]) => (
                  <div key={date} className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-2">
                      <h4 className="text-sm font-bold text-white">{formatDate(date)}</h4>
                    </div>
                    <div className="p-3">
                      <div className="space-y-2">
                        {dateBookings.map((booking) => (
                          <div key={booking.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-primary-100 p-1.5 rounded">
                                <Clock className="w-4 h-4 text-primary-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-gray-900">
                                  {booking.start_time} ({booking.duration_hours}h)
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {(() => {
                                    const guestName = (booking as any).guests?.name;
                                    const playerName = (booking as any).player_profiles?.full_name;
                                    return guestName || playerName || `Customer (ID: ${booking.id.slice(-8)})`;
                                  })()}
                                </div>
                                <div className="flex items-center space-x-3 text-xs text-gray-600 mt-0.5">
                                  <div className="flex items-center space-x-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{(() => {
                                      const guestPhone = (booking as any).guests?.phone;
                                      const playerPhone = (booking as any).player_profiles?.phone;
                                      return guestPhone || playerPhone || 'N/A';
                                    })()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Mail className="w-3 h-3" />
                                    <span>{(() => {
                                      const guestEmail = (booking as any).guests?.email;
                                      const playerEmail = (booking as any).player_profiles?.email;
                                      return guestEmail || playerEmail || 'N/A';
                                    })()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-primary-600">
                                Rs. {booking.total_price.toLocaleString()}
                              </div>
                              <div className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                                {booking.status}
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

        {/* Past Bookings Tab */}
        {activeTab === 'past-bookings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Past Bookings</h2>
              <div className="text-sm text-gray-600">
                {pastBookings.length} booking{pastBookings.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading past bookings...</p>
              </div>
            ) : pastBookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No past bookings</h3>
                <p className="text-gray-600">Past bookings will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedPastBookings).map(([date, dateBookings]) => (
                  <div key={date} className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-4 py-2">
                      <h4 className="text-sm font-bold text-white">{formatDate(date)}</h4>
                    </div>
                    <div className="p-3">
                      <div className="space-y-2">
                        {dateBookings.map((booking) => (
                          <div key={booking.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-gray-200 p-1.5 rounded">
                                <Clock className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-gray-700">
                                  {booking.start_time} ({booking.duration_hours}h)
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                  {(() => {
                                    const guestName = (booking as any).guests?.name;
                                    const playerName = (booking as any).player_profiles?.full_name;
                                    return guestName || playerName || `Customer (ID: ${booking.id.slice(-8)})`;
                                  })()}
                                </div>
                                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                                  <div className="flex items-center space-x-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{(() => {
                                      const guestPhone = (booking as any).guests?.phone;
                                      const playerPhone = (booking as any).player_profiles?.phone;
                                      return guestPhone || playerPhone || 'N/A';
                                    })()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Mail className="w-3 h-3" />
                                    <span>{(() => {
                                      const guestEmail = (booking as any).guests?.email;
                                      const playerEmail = (booking as any).player_profiles?.email;
                                      return guestEmail || playerEmail || 'N/A';
                                    })()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-600">
                                Rs. {booking.total_price.toLocaleString()}
                              </div>
                              <div className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                {booking.status}
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
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Create New Booking</h2>
                <p className="text-primary-100 mt-1">Add a booking for {venueName}</p>
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
                        onChange={handleDateChange}
                        min={getTomorrowDate()}
                        max={getMaxBookingDate()}
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-colors ${
                          dateError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'
                        }`}
                        required
                      />
                    </div>
                    {dateError && <p className="text-red-600 text-sm mt-1">{dateError}</p>}
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                          <span className="font-bold text-primary-600 text-lg">
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
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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

      <Footer onPageChange={onPageChange} />
    </div>
  );
}