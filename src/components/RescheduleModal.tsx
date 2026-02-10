import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { bookingsApi, type Booking } from '../lib/supabase';

interface RescheduleModalProps {
  booking: Booking & { pitches?: { name: string; location: string } };
  onClose: () => void;
  onSuccess: () => void;
}

export default function RescheduleModal({ booking, onClose, onSuccess }: RescheduleModalProps) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (newDate) {
      checkAvailability();
    }
  }, [newDate]);

  const checkAvailability = async () => {
    if (!newDate) return;

    setCheckingAvailability(true);
    setError(null);

    try {
      const existingBookings = await bookingsApi.getByDateAndPitch(newDate, booking.pitch_id);

      const allTimes: string[] = [];
      for (let hour = 6; hour <= 22; hour++) {
        allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
      }

      const available = allTimes.filter((time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + (booking.duration_hours * 60);

        for (const existingBooking of existingBookings) {
          if (existingBooking.id === booking.id) continue;

          const [existingHours, existingMinutes] = existingBooking.start_time.split(':').map(Number);
          const existingStartMinutes = existingHours * 60 + existingMinutes;
          const existingEndMinutes = existingStartMinutes + (existingBooking.duration_hours * 60);

          if (
            (startMinutes >= existingStartMinutes && startMinutes < existingEndMinutes) ||
            (endMinutes > existingStartMinutes && endMinutes <= existingEndMinutes) ||
            (startMinutes <= existingStartMinutes && endMinutes >= existingEndMinutes)
          ) {
            return false;
          }
        }
        return true;
      });

      setAvailableTimes(available);
    } catch (err) {
      console.error('Error checking availability:', err);
      setError('Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      setError('Please select both date and time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await bookingsApi.rescheduleBooking(booking.id, newDate, newTime, booking.duration_hours);
      onSuccess();
    } catch (err: any) {
      console.error('Error rescheduling booking:', err);
      setError(err.message || 'Failed to reschedule booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-secondary-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Reschedule Booking</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-secondary-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Current Booking Details</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-secondary-600" />
                <span>
                  {new Date(booking.booking_date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-secondary-600" />
                <span>{booking.start_time} ({booking.duration_hours} hour{booking.duration_hours > 1 ? 's' : ''})</span>
              </div>
              <div className="font-medium mt-2">
                Venue: {booking.pitches?.name || 'Football Pitch'}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select New Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setNewTime('');
                }}
                min={formatDateForInput(minDate)}
                max={formatDateForInput(maxDate)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can reschedule up to 30 days in advance
              </p>
            </div>

            {newDate && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select New Time
                </label>
                {checkingAvailability ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Checking availability...</p>
                  </div>
                ) : availableTimes.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-yellow-800 text-sm">
                      No available time slots for this date. Please select a different date.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setNewTime(time)}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          newTime === time
                            ? 'bg-secondary-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleReschedule}
              disabled={loading || !newDate || !newTime || checkingAvailability}
              className="flex-1 bg-secondary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-secondary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Rescheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  Confirm Reschedule
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
