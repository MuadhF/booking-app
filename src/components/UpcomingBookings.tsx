import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { bookingsApi, type Booking } from '../lib/supabase';

interface UpcomingBookingsProps {
  userId: string;
}

export default function UpcomingBookings({ userId }: UpcomingBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpcomingBookings();
  }, [userId]);

  const loadUpcomingBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const allBookings = await bookingsApi.getByPlayerId(userId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = allBookings
        .filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          return bookingDate >= today && booking.status === 'confirmed';
        })
        .sort((a, b) => {
          const dateCompare = new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.start_time.localeCompare(b.start_time);
        })
        .slice(0, 3);

      setBookings(upcoming);
    } catch (err) {
      console.error('Error loading upcoming bookings:', err);
      setError('Failed to load upcoming bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return new Date(dateString).toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Bookings</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Bookings</h2>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Bookings</h2>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No upcoming bookings</p>
          <p className="text-gray-500 text-xs mt-1">Book a pitch to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
          {bookings.length} booking{bookings.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="border border-gray-200 rounded-xl p-4 hover:border-green-500 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {(booking as any).pitches?.name || 'Unknown Venue'}
                </h3>
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{(booking as any).pitches?.location || 'Unknown location'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-4 h-4 mr-1.5 text-green-600" />
                <span className="font-medium">{formatDate(booking.booking_date)}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="w-4 h-4 mr-1.5 text-blue-600" />
                <span className="font-medium">{booking.start_time} ({booking.duration_hours}h)</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Ref: #{booking.id.slice(-8).toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-green-600">
                LKR {booking.total_price}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
