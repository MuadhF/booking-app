import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, ArrowRight, Star, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingsApi, reviewsApi, type Booking, type Review } from '../lib/supabase';
import ReviewForm from './ReviewForm';

interface UpcomingBookingsProps {
  userId: string;
  showPastBookings?: boolean;
}

export default function UpcomingBookings({ userId, showPastBookings = true }: UpcomingBookingsProps) {
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [totalUpcoming, setTotalUpcoming] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [bookingReviews, setBookingReviews] = useState<Record<string, Review>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadUpcomingBookings();
  }, [userId]);

  const loadUpcomingBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const allBookings = await bookingsApi.getByPlayerId(userId);
      const today = new Date();
      const now = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = allBookings
        .filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
          return bookingDateTime >= now && booking.status === 'confirmed';
        })
        .sort((a, b) => {
          const dateCompare = new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return a.start_time.localeCompare(b.start_time);
        });

      const completed = allBookings
        .filter(booking => {
          const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
          return bookingDateTime < now || booking.status === 'cancelled';
        })
        .sort((a, b) => {
          const dateCompare = new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime();
          if (dateCompare !== 0) return dateCompare;
          return b.start_time.localeCompare(a.start_time);
        });

      setTotalUpcoming(upcoming.length);
      setTotalCompleted(completed.length);
      setUpcomingBookings(upcoming.slice(0, 3));
      setCompletedBookings(completed.slice(0, 3));

      try {
        const reviewPromises = completed.slice(0, 3).map(booking =>
          reviewsApi.getByBookingId(booking.id)
        );
        const reviews = await Promise.all(reviewPromises);
        const reviewMap: Record<string, Review> = {};
        completed.slice(0, 3).forEach((booking, index) => {
          if (reviews[index]) {
            reviewMap[booking.id] = reviews[index];
          }
        });
        setBookingReviews(reviewMap);
      } catch (reviewError) {
        console.log('Reviews table not available yet:', reviewError);
        setBookingReviews({});
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setSelectedBooking(null);
    loadUpcomingBookings();
  };

  const handleWriteReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReviewForm(true);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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

  if (totalUpcoming === 0 && (showPastBookings ? totalCompleted === 0 : true)) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {showPastBookings ? 'Your Bookings' : 'Upcoming Bookings'}
        </h2>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">
            {showPastBookings ? 'No bookings yet' : 'No upcoming bookings'}
          </p>
          <p className="text-gray-500 text-xs mt-1">Book a pitch to get started!</p>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {totalUpcoming > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
              <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-1 rounded-full">
                {totalUpcoming} booking{totalUpcoming > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-primary-500 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                        {(booking as any).pitches?.name || 'Unknown Venue'}
                      </h3>
                      <div className="flex items-center text-gray-600 text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{(booking as any).pitches?.location || 'Unknown location'}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      LKR {booking.total_price}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-700">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-primary-600" />
                      <span className="font-medium">{formatDate(booking.booking_date)}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-3.5 h-3.5 mr-1 text-secondary-600" />
                      <span className="font-medium">{booking.start_time} ({booking.duration_hours}h)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showPastBookings && totalCompleted > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Past Bookings</h2>
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                {totalCompleted} completed
              </span>
            </div>

            <div className="space-y-2">
              {completedBookings.map((booking) => {
                const review = bookingReviews[booking.id];
                const isCancelled = booking.status === 'cancelled';
                return (
                  <div
                    key={booking.id}
                    className={`border rounded-lg p-3 ${
                      isCancelled
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-0.5">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {(booking as any).pitches?.name || 'Unknown Venue'}
                          </h3>
                          {isCancelled && (
                            <span className="text-xs font-semibold px-2 py-0.5 bg-red-600 text-white rounded-full">
                              Cancelled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-gray-600 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{(booking as any).pitches?.location || 'Unknown location'}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-600'}`}>
                        LKR {booking.total_price}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-gray-500" />
                        <span className="font-medium">{formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-500" />
                        <span className="font-medium">{booking.start_time} ({booking.duration_hours}h)</span>
                      </div>
                    </div>

                    {!isCancelled && (
                      review ? (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Your review:</span>
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          {review.review_text && (
                            <p className="text-xs text-gray-700 mt-1 line-clamp-2">{review.review_text}</p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleWriteReview(booking)}
                          className="mt-2 w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-secondary-600 text-white rounded-lg text-xs font-semibold hover:bg-secondary-700 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Write a Review</span>
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(totalUpcoming > 3 || (showPastBookings && totalCompleted > 3)) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              to="/profile"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-secondary-700 transition-all shadow-md hover:shadow-lg"
            >
              <span>View All Bookings</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>

      {showReviewForm && selectedBooking && (
        <ReviewForm
          bookingId={selectedBooking.id}
          pitchId={selectedBooking.pitch_id}
          pitchName={(selectedBooking as any).pitches?.name || 'Unknown Venue'}
          playerId={userId}
          onSuccess={handleReviewSuccess}
          onCancel={() => {
            setShowReviewForm(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </>
  );
}
